import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../shared/database/prisma.service";
import { AppEntity } from "../../domain/entities/app.entity";
import { AppsRepository, CreateAppData } from "../../domain/repositories/apps.repository";

@Injectable()
export class PrismaAppsRepository implements AppsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAppData): Promise<AppEntity> {
    await this.prisma.user.upsert({
      where: { id: data.user.id },
      update: { email: data.user.email, name: data.user.name },
      create: { id: data.user.id, email: data.user.email, name: data.user.name }
    });

    const app = await this.prisma.app.create({
      data: {
        userId: data.user.id,
        name: data.name,
        description: data.description
      }
    });
    return this.toEntity(app);
  }

  async findById(appId: string): Promise<AppEntity | null> {
    const app = await this.prisma.app.findUnique({ where: { id: appId } });
    return app ? this.toEntity(app) : null;
  }

  async listByUser(userId: string): Promise<AppEntity[]> {
    const apps = await this.prisma.app.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    return apps.map((app) => this.toEntity(app));
  }

  private toEntity(app: {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): AppEntity {
    return new AppEntity(app.id, app.userId, app.name, app.description, app.status, app.createdAt, app.updatedAt);
  }
}
