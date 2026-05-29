import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { QueuePort, QUEUE_PORT } from "../../../queue/application/ports/queue.port";
import { SnapshotService } from "../../../storage/application/services/snapshot.service";
import { VERSIONS_REPOSITORY, VersionsRepository } from "../../domain/repositories/versions.repository";
import { CreateVersionDto } from "../dtos/create-version.dto";

@Injectable()
export class CreateVersionUseCase {
  constructor(
    @Inject(VERSIONS_REPOSITORY) private readonly versions: VersionsRepository,
    private readonly snapshots: SnapshotService,
    @Inject(QUEUE_PORT) private readonly queue: QueuePort
  ) {}

  async execute(appId: string, dto: CreateVersionDto) {
    const owner = await this.versions.getAppOwner(appId);
    if (!owner) throw new NotFoundException("App not found");

    const versionId = randomUUID();
    const versionNumber = await this.versions.nextVersionNumber(appId);
    const snapshot = await this.snapshots.createSnapshot({
      userId: owner.userId,
      appId,
      versionId,
      versionNumber,
      files: dto.files
    });

    const version = await this.versions.create({
      id: versionId,
      appId,
      versionNumber,
      storagePath: snapshot.storagePath,
      checksum: snapshot.checksum,
      createdBy: dto.createdBy ?? owner.userId
    });

    await this.queue.publish({
      type: "APP_VERSION_CREATED",
      payload: { appId, versionId, versionNumber }
    });

    return version;
  }
}
