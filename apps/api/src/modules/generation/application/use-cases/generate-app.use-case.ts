import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AgentServiceClient } from "../../../agents/infrastructure/providers/agent-service.client";
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
    private readonly files: GeneratedAppFilesService,
    private readonly qualityGate: RequestQualityGateUseCase
  ) {}

  async execute(user: AuthenticatedUser, dto: GenerateAppDto) {
    const plan = await this.agent.plan(this.buildAgentPrompt(dto.prompt));
    const generated = this.files.create({ prompt: dto.prompt, requestedName: dto.name, plan: plan.response });
    const app = await this.apps.create({
      user,
      name: generated.appName,
      description: dto.prompt.slice(0, 220)
    });

    await this.queue.publish({ type: "APP_CREATED", payload: { appId: app.id, userId: user.id } });

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

    const quality = await this.qualityGate.execute(app.id, version.id);

    return {
      app,
      version,
      quality,
      agent: plan,
      files: generated.files.map((file) => ({ path: file.path, language: file.language, preview: file.preview })),
      previewHtml: generated.previewHtml,
      previewUrl: `/apps/${app.id}/preview`,
      timeline: [
        { label: "Prompt received", status: "completed" },
        { label: "Architecture plan generated", status: "completed", provider: plan.provider },
        { label: "Files generated", status: "completed", count: generated.files.length },
        { label: `Snapshot v${version.versionNumber} created`, status: "completed" },
        { label: `Quality gate ${quality.quality.status}`, status: "completed", score: quality.quality.qualityScore },
        { label: "Preview ready", status: "completed" }
      ]
    };
  }

  async preview(appId: string) {
    const app = await this.apps.findById(appId);
    if (!app) return null;
    try {
      return (await this.storage.getObject(this.previewPath(app.userId, app.id))).toString("utf8");
    } catch {
      return null;
    }
  }

  private previewPath(userId: string, appId: string) {
    return `users/${userId}/apps/${appId}/preview/index.html`;
  }

  private buildAgentPrompt(prompt: string) {
    return [
      "Plan a small generated application for DeployForge AI.",
      "Return practical architecture, modules, risks and quality gate notes.",
      "Do not include secrets. Do not suggest removing tests.",
      "",
      `User prompt: ${prompt}`
    ].join("\n");
  }
}
