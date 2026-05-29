import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../shared/database/prisma.service";

@Injectable()
export class PrismaUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertDevUser() {
    return this.prisma.user.upsert({
      where: { id: "dev-user" },
      update: { email: "dev@deployforge.local", name: "DeployForge Dev" },
      create: { id: "dev-user", email: "dev@deployforge.local", name: "DeployForge Dev" }
    });
  }
}
