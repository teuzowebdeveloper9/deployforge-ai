import { Module } from "@nestjs/common";
import { SendAgentMessageUseCase } from "./application/use-cases/send-agent-message.use-case";
import { AgentServiceClient } from "./infrastructure/providers/agent-service.client";
import { PrismaAgentConversationRepository } from "./infrastructure/providers/prisma-agent-conversation.repository";
import { AgentsController } from "./presentation/controllers/agents.controller";

@Module({
  controllers: [AgentsController],
  providers: [SendAgentMessageUseCase, AgentServiceClient, PrismaAgentConversationRepository],
  exports: [AgentServiceClient]
})
export class AgentsModule {}
