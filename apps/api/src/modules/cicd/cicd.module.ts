import { Module } from "@nestjs/common";
import { AgentsModule } from "../agents/agents.module";
import { AuthModule } from "../auth/auth.module";
import { QualityModule } from "../quality/quality.module";
import { StorageModule } from "../storage/storage.module";
import { VersionsModule } from "../versions/versions.module";
import { RunCiCdUseCase } from "./application/use-cases/run-cicd.use-case";
import { CiCdController } from "./presentation/controllers/cicd.controller";

@Module({
  imports: [AuthModule, VersionsModule, QualityModule, AgentsModule, StorageModule],
  controllers: [CiCdController],
  providers: [RunCiCdUseCase]
})
export class CiCdModule {}
