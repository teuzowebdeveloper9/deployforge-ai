import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../../../shared/database/prisma.service";
import { assertAppOwnership } from "../../../../shared/security/app-authorization";
import { AuthenticatedUser } from "../../../auth/application/ports/auth-provider.port";
import { GeneratedAppFilesService } from "../../../generation/application/services/generated-app-files.service";
import { RequestQualityGateUseCase } from "../../../quality/application/use-cases/request-quality-gate.use-case";
import { QueuePort, QUEUE_PORT } from "../../../queue/application/ports/queue.port";
import { STORAGE_PORT, StoragePort } from "../../../storage/application/ports/storage.port";
import { SnapshotService } from "../../../storage/application/services/snapshot.service";
import { VERSIONS_REPOSITORY, VersionsRepository } from "../../../versions/domain/repositories/versions.repository";
import { AgentServiceClient } from "../../infrastructure/providers/agent-service.client";
import { PrismaAgentConversationRepository } from "../../infrastructure/providers/prisma-agent-conversation.repository";
import { AgentMessageDto } from "../dtos/agent-message.dto";

@Injectable()
export class SendAgentMessageUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversations: PrismaAgentConversationRepository,
    private readonly agentService: AgentServiceClient,
    @Inject(VERSIONS_REPOSITORY) private readonly versions: VersionsRepository,
    @Inject(QUEUE_PORT) private readonly queue: QueuePort,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    private readonly snapshots: SnapshotService,
    private readonly generatedFiles: GeneratedAppFilesService,
    private readonly qualityGate: RequestQualityGateUseCase
  ) {}

  async execute(user: AuthenticatedUser, appId: string, dto: AgentMessageDto) {
    const app = assertAppOwnership(
      await this.prisma.app.findUnique({
        where: { id: appId },
        select: { id: true, userId: true, name: true, description: true }
      }),
      user
    );

    const run = await this.conversations.startRun(appId, dto.message);
    await this.conversations.saveMessage(appId, "user", dto.message);
    await this.conversations.saveMessage(
      appId,
      "assistant",
      "I’m generating a new runnable version for this project and preparing the preview."
    );

    const generationPrompt = [
      "Continue this existing DeployForge AI app by generating a complete runnable replacement file set.",
      "Return the same bounded app file payload shape used for first-generation apps.",
      "The preview/index.html file must be the actual updated application, not an implementation plan.",
      "Preserve the product direction implied by the current app name and description.",
      "",
      `Current app name: ${app.name}`,
      `Current app description: ${app.description ?? "No description yet."}`,
      `User requested change: ${dto.message}`
    ].join("\n");

    const agentGeneration = await this.agentService.generateApp(generationPrompt);
    const generated = this.generatedFiles.create({
      prompt: dto.message,
      requestedName: app.name,
      generated: agentGeneration
    });

    const versionId = randomUUID();
    const versionNumber = await this.versions.nextVersionNumber(app.id);
    const snapshot = await this.snapshots.createSnapshot({
      userId: app.userId,
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
      createdBy: app.userId
    });

    await this.storage.putObject(this.previewPath(app.userId, app.id), generated.previewHtml, "text/html");
    await this.queue.publish({
      type: "APP_VERSION_CREATED",
      payload: { appId: app.id, versionId, versionNumber }
    });

    const quality = await this.qualityGate.execute(user, app.id, version.id);
    const response = [
      generated.notes || "Generated a runnable app update from your prompt.",
      "",
      `Generated ${generated.files.length} files and created snapshot v${version.versionNumber}.`,
      `Quality gate finished with ${quality.quality.status} (${quality.quality.qualityScore}/100).`,
      `Preview updated at /apps/${app.id}/preview.`,
      "",
      "Generated files:",
      ...generated.files.map((file) => `- ${file.path} (${file.language})`)
    ].join("\n");

    await this.conversations.saveMessage(appId, "assistant", response);
    await this.conversations.finishRun(run.id, "COMPLETED", response);

    return {
      runId: run.id,
      message: {
        mode: "generate-app",
        response,
        provider: generated.provider,
        model: generated.model
      },
      version,
      quality,
      files: generated.files.map((file) => ({ path: file.path, language: file.language, preview: file.preview })),
      previewUrl: `/apps/${app.id}/preview`
    };
  }

  private previewPath(userId: string, appId: string) {
    return `users/${userId}/apps/${appId}/preview/index.html`;
  }
}
