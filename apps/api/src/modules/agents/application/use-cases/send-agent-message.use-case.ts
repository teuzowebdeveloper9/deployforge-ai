import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../shared/database/prisma.service";
import { AgentServiceClient } from "../../infrastructure/providers/agent-service.client";
import { PrismaAgentConversationRepository } from "../../infrastructure/providers/prisma-agent-conversation.repository";
import { AgentMessageDto } from "../dtos/agent-message.dto";

@Injectable()
export class SendAgentMessageUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversations: PrismaAgentConversationRepository,
    private readonly agentService: AgentServiceClient
  ) {}

  async execute(appId: string, dto: AgentMessageDto) {
    const app = await this.prisma.app.findUnique({ where: { id: appId }, select: { id: true } });
    if (!app) throw new NotFoundException("App not found");

    const run = await this.conversations.startRun(appId, dto.message);
    await this.conversations.saveMessage(appId, "user", dto.message);
    const plan = await this.agentService.plan(dto.message);
    await this.conversations.saveMessage(appId, "assistant", plan.response);
    await this.conversations.finishRun(run.id, "COMPLETED", plan.response);

    return { runId: run.id, message: plan };
  }
}
