import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaAgentConversationRepository } from "../../infrastructure/providers/prisma-agent-conversation.repository";

@Injectable()
export class ListAgentStepsUseCase {
  constructor(private readonly conversations: PrismaAgentConversationRepository) {}

  async execute(appId: string) {
    const steps = await this.conversations.listSteps(appId);
    if (!steps) throw new NotFoundException("App not found");
    return steps;
  }
}
