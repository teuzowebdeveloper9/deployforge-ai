import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { BuildsModule } from "../builds/builds.module";
import { QueueModule } from "../queue/queue.module";
import { StorageModule } from "../storage/storage.module";
import { VersionsModule } from "../versions/versions.module";
import { RequestQualityGateUseCase } from "./application/use-cases/request-quality-gate.use-case";
import { RunnerClient } from "./infrastructure/runner-client";
import { QualityController } from "./presentation/controllers/quality.controller";

@Module({
  imports: [AuthModule, VersionsModule, BuildsModule, StorageModule, QueueModule],
  controllers: [QualityController],
  providers: [RequestQualityGateUseCase, RunnerClient],
  exports: [RequestQualityGateUseCase]
})
export class QualityModule {}
