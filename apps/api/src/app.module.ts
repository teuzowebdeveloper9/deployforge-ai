import { Module } from "@nestjs/common";
import { AgentsModule } from "./modules/agents/agents.module";
import { AppsModule } from "./modules/apps/apps.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BuildsModule } from "./modules/builds/builds.module";
import { EnvsModule } from "./modules/envs/envs.module";
import { GenerationModule } from "./modules/generation/generation.module";
import { QualityModule } from "./modules/quality/quality.module";
import { QueueModule } from "./modules/queue/queue.module";
import { SecretsModule } from "./modules/secrets/secrets.module";
import { StorageModule } from "./modules/storage/storage.module";
import { UsersModule } from "./modules/users/users.module";
import { VersionsModule } from "./modules/versions/versions.module";
import { DatabaseModule } from "./shared/database/database.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    StorageModule,
    QueueModule,
    SecretsModule,
    UsersModule,
    AppsModule,
    VersionsModule,
    BuildsModule,
    QualityModule,
    AgentsModule,
    EnvsModule,
    GenerationModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
