import { Module } from "@nestjs/common";
import { ListAgentMessagesUseCase } from "./application/use-cases/list-agent-messages.use-case";
import { ListAgentStepsUseCase } from "./application/use-cases/list-agent-steps.use-case";
import { SendAgentMessageUseCase } from "./application/use-cases/send-agent-message.use-case";
import { AgentServiceClient } from "./infrastructure/providers/agent-service.client";
import { PrismaAgentConversationRepository } from "./infrastructure/providers/prisma-agent-conversation.repository";
import { AgentsController } from "./presentation/controllers/agents.controller";

@Module({
  controllers: [AgentsController],
  providers: [SendAgentMessageUseCase, ListAgentMessagesUseCase, ListAgentStepsUseCase, AgentServiceClient, PrismaAgentConversationRepository],
  exports: [AgentServiceClient, PrismaAgentConversationRepository]
})
export class AgentsModule {}
