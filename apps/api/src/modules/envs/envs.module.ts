import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { SecretsModule } from "../secrets/secrets.module";
import { CreateEnvUseCase } from "./application/use-cases/create-env.use-case";
import { ListEnvsUseCase } from "./application/use-cases/list-envs.use-case";
import { PrismaEnvsRepository } from "./infrastructure/persistence/prisma-envs.repository";
import { EnvsController } from "./presentation/controllers/envs.controller";

@Module({
  imports: [AuthModule, SecretsModule],
  controllers: [EnvsController],
  providers: [PrismaEnvsRepository, ListEnvsUseCase, CreateEnvUseCase]
})
export class EnvsModule {}
