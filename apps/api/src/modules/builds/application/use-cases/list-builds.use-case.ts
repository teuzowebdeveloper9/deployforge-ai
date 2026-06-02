import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../shared/database/prisma.service";
import { assertAppOwnership } from "../../../../shared/security/app-authorization";
import { AuthenticatedUser } from "../../../auth/application/ports/auth-provider.port";
import { BUILDS_REPOSITORY, BuildsRepository } from "../../domain/repositories/builds.repository";

@Injectable()
export class ListBuildsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(BUILDS_REPOSITORY) private readonly builds: BuildsRepository
  ) {}

  async execute(user: AuthenticatedUser, appId: string) {
    const app = await this.prisma.app.findUnique({ where: { id: appId }, select: { id: true, userId: true } });
    assertAppOwnership(app, user);
    return this.builds.listByApp(appId);
  }
}
