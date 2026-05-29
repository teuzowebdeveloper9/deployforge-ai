import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../shared/database/prisma.service";
import { AppVersionEntity } from "../../domain/entities/app-version.entity";
import {
  AppOwner,
  CreateVersionData,
  VersionsRepository
} from "../../domain/repositories/versions.repository";

@Injectable()
export class PrismaVersionsRepository implements VersionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAppOwner(appId: string): Promise<AppOwner | null> {
    const app = await this.prisma.app.findUnique({ where: { id: appId }, select: { id: true, userId: true } });
    return app ? { appId: app.id, userId: app.userId } : null;
  }

  async nextVersionNumber(appId: string): Promise<number> {
    const latest = await this.prisma.appVersion.findFirst({
      where: { appId },
      orderBy: { versionNumber: "desc" }
    });
    return (latest?.versionNumber ?? 0) + 1;
  }

  async create(data: CreateVersionData): Promise<AppVersionEntity> {
    const version = await this.prisma.appVersion.create({ data });
    return this.toEntity(version);
  }

  async listByApp(appId: string): Promise<AppVersionEntity[]> {
    const versions = await this.prisma.appVersion.findMany({
      where: { appId },
      orderBy: { versionNumber: "desc" }
    });
    return versions.map((version) => this.toEntity(version));
  }

  async findById(appId: string, versionId: string): Promise<AppVersionEntity | null> {
    const version = await this.prisma.appVersion.findFirst({ where: { id: versionId, appId } });
    return version ? this.toEntity(version) : null;
  }

  async updateQualityScore(versionId: string, score: number, status: string): Promise<void> {
    await this.prisma.appVersion.update({
      where: { id: versionId },
      data: { qualityScore: score, status }
    });
  }

  private toEntity(version: {
    id: string;
    appId: string;
    versionNumber: number;
    storagePath: string;
    checksum: string;
    status: string;
    qualityScore: number | null;
    createdAt: Date;
    createdBy: string;
  }): AppVersionEntity {
    return new AppVersionEntity(
      version.id,
      version.appId,
      version.versionNumber,
      version.storagePath,
      version.checksum,
      version.status,
      version.qualityScore,
      version.createdAt,
      version.createdBy
    );
  }
}
