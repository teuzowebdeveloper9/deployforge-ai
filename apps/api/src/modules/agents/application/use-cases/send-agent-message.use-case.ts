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
    await this.conversations.saveMessage(appId, "assistant", "I’m reading the existing project context and preparing the next implementation step.");
    const plan = await this.agentService.plan(
      [
        "Continue work on an existing DeployForge AI project.",
        "Do not create a new app. Treat this prompt as a follow-up in the same app context.",
        "Do not ask the user for permission before coding or before the next action. Provide the concrete implementation path directly.",
        "Explain the files or modules to change, what risks exist, and what quality gates should run.",
        "Return a structured Markdown response with short sections and bullet points.",
        "Do not wrap the whole response in a fenced code block.",
        "",
        `User message: ${dto.message}`
      ].join("\n")
    );
    await this.conversations.saveMessage(appId, "assistant", plan.response);
    await this.conversations.finishRun(run.id, "COMPLETED", plan.response);

    return { runId: run.id, message: plan };
  }
}
