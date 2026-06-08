import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { AuthenticatedUser } from "../../../auth/application/ports/auth-provider.port";
import { BUILDS_REPOSITORY, BuildsRepository } from "../../../builds/domain/repositories/builds.repository";
import { QueuePort, QUEUE_PORT } from "../../../queue/application/ports/queue.port";
import { STORAGE_PORT, StoragePort } from "../../../storage/application/ports/storage.port";
import { VERSIONS_REPOSITORY, VersionsRepository } from "../../../versions/domain/repositories/versions.repository";
import { RunnerClient } from "../../infrastructure/runner-client";

@Injectable()
export class RequestQualityGateUseCase {
  constructor(
    @Inject(VERSIONS_REPOSITORY) private readonly versions: VersionsRepository,
    @Inject(BUILDS_REPOSITORY) private readonly builds: BuildsRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @Inject(QUEUE_PORT) private readonly queue: QueuePort,
    private readonly runner: RunnerClient
  ) {}

  async execute(user: AuthenticatedUser, appId: string, versionId: string, options?: { buildType?: string }) {
    const owner = await this.versions.getAppOwner(appId);
    if (!owner) throw new NotFoundException("App not found");
    if (owner.userId !== user.id) throw new NotFoundException("App not found");

    const version = await this.versions.findById(appId, versionId);
    if (!version) throw new NotFoundException("Version not found");

    const build = await this.builds.create({
      appId,
      versionId,
      status: "RUNNING",
      type: options?.buildType ?? "QUALITY_GATE"
    });

    await this.queue.publish({
      type: "QUALITY_GATE_REQUESTED",
      payload: { appId, versionId, buildId: build.id }
    });

    const result = await this.runner.runQualityGate({
      appId,
      versionId,
      buildId: build.id,
      sourcePath: this.storage.localPath(version.storagePath),
      user
    });

    const basePath = `users/${owner.userId}/apps/${appId}/builds/${build.id}`;
    const logsPath = `${basePath}/logs.txt`;
    const reportPath = `${basePath}/quality-report.json`;
    await this.storage.putObject(logsPath, result.logs, "text/plain");
    await this.storage.putObject(reportPath, JSON.stringify(result.report, null, 2), "application/json");
    await this.builds.appendLog(build.id, result.status === "PASSED" ? "info" : "error", result.logs.slice(0, 4000));
    await this.versions.updateQualityScore(versionId, result.qualityScore, result.status);

    const completed = await this.builds.complete({
      buildId: build.id,
      status: result.status,
      logsPath,
      reportPath
    });

    await this.queue.publish({
      type: "QUALITY_GATE_COMPLETED",
      payload: { appId, versionId, buildId: build.id, status: result.status, qualityScore: result.qualityScore }
    });

    return { build: completed, quality: { status: result.status, qualityScore: result.qualityScore }, logs: result.logs };
  }
}
