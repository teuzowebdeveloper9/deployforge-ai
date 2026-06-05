import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { GeneratedAppFilesService } from "../generation/application/services/generated-app-files.service";
import { QualityModule } from "../quality/quality.module";
import { QueueModule } from "../queue/queue.module";
import { StorageModule } from "../storage/storage.module";
import { VersionsModule } from "../versions/versions.module";
import { ListAgentMessagesUseCase } from "./application/use-cases/list-agent-messages.use-case";
import { ListAgentStepsUseCase } from "./application/use-cases/list-agent-steps.use-case";
import { SendAgentMessageUseCase } from "./application/use-cases/send-agent-message.use-case";
import { AgentServiceClient } from "./infrastructure/providers/agent-service.client";
import { PrismaAgentConversationRepository } from "./infrastructure/providers/prisma-agent-conversation.repository";
import { AgentsController } from "./presentation/controllers/agents.controller";

@Module({
  imports: [AuthModule, VersionsModule, QueueModule, StorageModule, QualityModule],
  controllers: [AgentsController],
  providers: [
    SendAgentMessageUseCase,
    ListAgentMessagesUseCase,
    ListAgentStepsUseCase,
    AgentServiceClient,
    PrismaAgentConversationRepository,
    GeneratedAppFilesService
  ],
  exports: [AgentServiceClient, PrismaAgentConversationRepository]
})
export class AgentsModule {}
