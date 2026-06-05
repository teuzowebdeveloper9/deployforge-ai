import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { assertAppOwnership } from "../../../../shared/security/app-authorization";
import { AgentServiceClient } from "../../../agents/infrastructure/providers/agent-service.client";
import { PrismaAgentConversationRepository } from "../../../agents/infrastructure/providers/prisma-agent-conversation.repository";
import { AuthenticatedUser } from "../../../auth/application/ports/auth-provider.port";
import { APPS_REPOSITORY, AppsRepository } from "../../../apps/domain/repositories/apps.repository";
import { RequestQualityGateUseCase } from "../../../quality/application/use-cases/request-quality-gate.use-case";
import { QueuePort, QUEUE_PORT } from "../../../queue/application/ports/queue.port";
import { STORAGE_PORT, StoragePort } from "../../../storage/application/ports/storage.port";
import { SnapshotService } from "../../../storage/application/services/snapshot.service";
import { VERSIONS_REPOSITORY, VersionsRepository } from "../../../versions/domain/repositories/versions.repository";
import { GenerateAppDto } from "../dtos/generate-app.dto";
import { GeneratedAppFilesService } from "../services/generated-app-files.service";

@Injectable()
export class GenerateAppUseCase {
  constructor(
    @Inject(APPS_REPOSITORY) private readonly apps: AppsRepository,
    @Inject(VERSIONS_REPOSITORY) private readonly versions: VersionsRepository,
    @Inject(QUEUE_PORT) private readonly queue: QueuePort,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    private readonly snapshots: SnapshotService,
    private readonly agent: AgentServiceClient,
    private readonly conversations: PrismaAgentConversationRepository,
    private readonly files: GeneratedAppFilesService,
    private readonly qualityGate: RequestQualityGateUseCase
  ) {}

  async execute(user: AuthenticatedUser, dto: GenerateAppDto) {
    const agentGeneration = await this.agent.generateApp(dto.prompt, user);
    const generated = this.files.create({ prompt: dto.prompt, requestedName: dto.name, generated: agentGeneration });
    const app = await this.apps.create({
      user,
      name: generated.appName,
      description: generated.description.slice(0, 220)
    });

    await this.queue.publish({ type: "APP_CREATED", payload: { appId: app.id, userId: user.id } });
    const run = await this.conversations.startRun(app.id, dto.prompt);
    await this.conversations.saveMessage(app.id, "user", dto.prompt);
    await this.conversations.saveMessage(app.id, "assistant", "I’ll start by understanding your product idea and generating the first app version.");

    const versionId = randomUUID();
    const versionNumber = await this.versions.nextVersionNumber(app.id);
    const snapshot = await this.snapshots.createSnapshot({
      userId: user.id,
      appId: app.id,
      versionId,
      versionNumber,
      files: generated.files
    });

    const version = await this.versions.create({
      id: versionId,
      appId: app.id,
      versionNumber,
      storagePath: snapshot.storagePath,
      checksum: snapshot.checksum,
      createdBy: user.id
    });

    await this.storage.putObject(this.previewPath(user.id, app.id), generated.previewHtml, "text/html");
    await this.queue.publish({
      type: "APP_VERSION_CREATED",
      payload: { appId: app.id, versionId, versionNumber }
    });

    const quality = await this.qualityGate.execute(user, app.id, version.id);
    const agentSummary = [
      generated.notes || "Application files were generated from the prompt.",
      "",
      `Generated ${generated.files.length} files and created snapshot v${version.versionNumber}.`,
      `Quality gate finished with ${quality.quality.status} (${quality.quality.qualityScore}/100).`,
      "The preview is ready on the right panel."
    ].join("\n");
    await this.conversations.saveMessage(app.id, "assistant", agentSummary);
    await this.conversations.finishRun(run.id, "COMPLETED", agentSummary);

    return {
      app,
      version,
      quality,
      agent: {
        mode: "generate-app",
        response: generated.notes,
        provider: generated.provider,
        model: generated.model
      },
      files: generated.files.map((file) => ({ path: file.path, language: file.language, preview: file.preview })),
      previewHtml: generated.previewHtml,
      previewUrl: `/apps/${app.id}/preview`,
      timeline: [
        { label: "Prompt received", status: "completed" },
        { label: "Application code generated", status: "completed", provider: generated.provider },
        { label: "Files generated", status: "completed", count: generated.files.length },
        { label: `Snapshot v${version.versionNumber} created`, status: "completed" },
        { label: `Quality gate ${quality.quality.status}`, status: "completed", score: quality.quality.qualityScore },
        { label: "Preview ready", status: "completed" }
      ]
    };
  }

  async preview(user: AuthenticatedUser, appId: string) {
    const app = assertAppOwnership(await this.apps.findById(appId), user);
    try {
      return (await this.storage.getObject(this.previewPath(app.userId, app.id))).toString("utf8");
    } catch {
      return null;
    }
  }

  private previewPath(userId: string, appId: string) {
    return `users/${userId}/apps/${appId}/preview/index.html`;
  }
}
