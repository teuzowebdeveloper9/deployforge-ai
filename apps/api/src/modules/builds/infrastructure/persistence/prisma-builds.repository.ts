import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../shared/database/prisma.service";
import { BuildEntity } from "../../domain/entities/build.entity";
import {
  BuildsRepository,
  CompleteBuildData,
  CreateBuildData
} from "../../domain/repositories/builds.repository";

@Injectable()
export class PrismaBuildsRepository implements BuildsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBuildData): Promise<BuildEntity> {
    const build = await this.prisma.build.create({
      data: {
        appId: data.appId,
        versionId: data.versionId,
        type: data.type,
        status: data.status,
        startedAt: new Date()
      }
    });
    return this.toEntity(build);
  }

  async listByApp(appId: string): Promise<BuildEntity[]> {
    const builds = await this.prisma.build.findMany({
      where: { appId },
      orderBy: { startedAt: "desc" }
    });
    return builds.map((build) => this.toEntity(build));
  }

  async complete(data: CompleteBuildData): Promise<BuildEntity> {
    const build = await this.prisma.build.update({
      where: { id: data.buildId },
      data: {
        status: data.status,
        logsPath: data.logsPath,
        reportPath: data.reportPath,
        finishedAt: new Date()
      }
    });
    return this.toEntity(build);
  }

  async appendLog(buildId: string, level: string, message: string): Promise<void> {
    await this.prisma.buildLog.create({ data: { buildId, level, message } });
  }

  private toEntity(build: {
    id: string;
    appId: string;
    versionId: string | null;
    status: string;
    type: string;
    logsPath: string | null;
    reportPath: string | null;
    startedAt: Date | null;
    finishedAt: Date | null;
  }): BuildEntity {
    return new BuildEntity(
      build.id,
      build.appId,
      build.versionId,
      build.status,
      build.type,
      build.logsPath,
      build.reportPath,
      build.startedAt,
      build.finishedAt
    );
  }
}
