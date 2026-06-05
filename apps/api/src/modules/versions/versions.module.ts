import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { QueueModule } from "../queue/queue.module";
import { StorageModule } from "../storage/storage.module";
import { VERSIONS_REPOSITORY } from "./domain/repositories/versions.repository";
import { CreateVersionUseCase } from "./application/use-cases/create-version.use-case";
import { ListVersionsUseCase } from "./application/use-cases/list-versions.use-case";
import { PrismaVersionsRepository } from "./infrastructure/persistence/prisma-versions.repository";
import { VersionsController } from "./presentation/controllers/versions.controller";

@Module({
  imports: [AuthModule, StorageModule, QueueModule],
  controllers: [VersionsController],
  providers: [
    CreateVersionUseCase,
    ListVersionsUseCase,
    PrismaVersionsRepository,
    {
      provide: VERSIONS_REPOSITORY,
      useExisting: PrismaVersionsRepository
    }
  ],
  exports: [VERSIONS_REPOSITORY]
})
export class VersionsModule {}
