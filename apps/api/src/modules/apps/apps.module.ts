import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { QueueModule } from "../queue/queue.module";
import { APPS_REPOSITORY } from "./domain/repositories/apps.repository";
import { CreateAppUseCase } from "./application/use-cases/create-app.use-case";
import { GetAppUseCase } from "./application/use-cases/get-app.use-case";
import { ListAppsUseCase } from "./application/use-cases/list-apps.use-case";
import { PrismaAppsRepository } from "./infrastructure/persistence/prisma-apps.repository";
import { AppsController } from "./presentation/controllers/apps.controller";

@Module({
  imports: [AuthModule, QueueModule],
  controllers: [AppsController],
  providers: [
    CreateAppUseCase,
    GetAppUseCase,
    ListAppsUseCase,
    PrismaAppsRepository,
    {
      provide: APPS_REPOSITORY,
      useExisting: PrismaAppsRepository
    }
  ],
  exports: [APPS_REPOSITORY]
})
export class AppsModule {}
