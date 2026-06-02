import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../shared/database/prisma.service";
import { assertAppOwnership } from "../../../../shared/security/app-authorization";
import { AuthenticatedUser } from "../../../auth/application/ports/auth-provider.port";
import { PrismaEnvsRepository } from "../../infrastructure/persistence/prisma-envs.repository";

@Injectable()
export class ListEnvsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly envs: PrismaEnvsRepository
  ) {}

  async execute(user: AuthenticatedUser, appId: string) {
    const app = await this.prisma.app.findUnique({ where: { id: appId }, select: { id: true, userId: true } });
    assertAppOwnership(app, user);
    return this.envs.list(appId);
  }
}
