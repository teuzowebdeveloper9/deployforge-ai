import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../shared/database/prisma.service";

@Injectable()
export class PrismaEnvsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(appId: string) {
    return this.prisma.envVariable.findMany({
      where: { appId },
      orderBy: [{ environment: "asc" }, { key: "asc" }],
      select: {
        id: true,
        appId: true,
        environment: true,
        key: true,
        secretReference: true,
        isRequired: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  upsert(data: {
    appId: string;
    environment: string;
    key: string;
    secretReference: string;
    isRequired: boolean;
  }) {
    return this.prisma.envVariable.upsert({
      where: {
        appId_environment_key: {
          appId: data.appId,
          environment: data.environment,
          key: data.key
        }
      },
      update: {
        secretReference: data.secretReference,
        isRequired: data.isRequired
      },
      create: data
    });
  }
}
