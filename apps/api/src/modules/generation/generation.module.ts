import { Module } from "@nestjs/common";
import { AgentsModule } from "../agents/agents.module";
import { AppsModule } from "../apps/apps.module";
import { AuthModule } from "../auth/auth.module";
import { QualityModule } from "../quality/quality.module";
import { QueueModule } from "../queue/queue.module";
import { StorageModule } from "../storage/storage.module";
import { VersionsModule } from "../versions/versions.module";
import { GeneratedAppFilesService } from "./application/services/generated-app-files.service";
import { GenerateAppUseCase } from "./application/use-cases/generate-app.use-case";
import { GenerationController } from "./presentation/controllers/generation.controller";

@Module({
  imports: [AuthModule, AppsModule, VersionsModule, QueueModule, StorageModule, AgentsModule, QualityModule],
  controllers: [GenerationController],
  providers: [GenerateAppUseCase, GeneratedAppFilesService]
})
export class GenerationModule {}
