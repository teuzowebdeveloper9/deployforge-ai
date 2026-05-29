import { Module } from "@nestjs/common";
import { BUILDS_REPOSITORY } from "./domain/repositories/builds.repository";
import { ListBuildsUseCase } from "./application/use-cases/list-builds.use-case";
import { PrismaBuildsRepository } from "./infrastructure/persistence/prisma-builds.repository";
import { BuildsController } from "./presentation/controllers/builds.controller";

@Module({
  controllers: [BuildsController],
  providers: [
    ListBuildsUseCase,
    PrismaBuildsRepository,
    {
      provide: BUILDS_REPOSITORY,
      useExisting: PrismaBuildsRepository
    }
  ],
  exports: [BUILDS_REPOSITORY]
})
export class BuildsModule {}
