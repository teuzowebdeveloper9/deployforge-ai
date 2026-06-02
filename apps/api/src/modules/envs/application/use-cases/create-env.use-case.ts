import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../shared/database/prisma.service";
import { assertAppOwnership } from "../../../../shared/security/app-authorization";
import { AuthenticatedUser } from "../../../auth/application/ports/auth-provider.port";
import { SECRETS_PORT, SecretsPort } from "../../../secrets/application/ports/secrets.port";
import { PrismaEnvsRepository } from "../../infrastructure/persistence/prisma-envs.repository";
import { CreateEnvDto } from "../dtos/create-env.dto";

@Injectable()
export class CreateEnvUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly envs: PrismaEnvsRepository,
    @Inject(SECRETS_PORT) private readonly secrets: SecretsPort
  ) {}

  async execute(user: AuthenticatedUser, appId: string, dto: CreateEnvDto) {
    const app = await this.prisma.app.findUnique({ where: { id: appId }, select: { id: true, userId: true } });
    if (!app) throw new NotFoundException("App not found");
    assertAppOwnership(app, user);

    const secretReference = dto.secretReference ?? this.secrets.createReference(appId, dto.environment, dto.key);
    return this.envs.upsert({
      appId,
      environment: dto.environment,
      key: dto.key,
      secretReference,
      isRequired: dto.isRequired ?? false
    });
  }
}
