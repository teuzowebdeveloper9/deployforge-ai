import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../shared/database/prisma.service";
import { PrismaAgentConversationRepository } from "../../infrastructure/providers/prisma-agent-conversation.repository";

@Injectable()
export class ListAgentMessagesUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversations: PrismaAgentConversationRepository
  ) {}

  async execute(appId: string) {
    const app = await this.prisma.app.findUnique({ where: { id: appId }, select: { id: true } });
    if (!app) throw new NotFoundException("App not found");

    const messages = await this.conversations.listMessages(appId);
    return messages.map((message) => ({
      id: message.id,
      appId: message.appId,
      role: message.role === "assistant" ? "agent" : message.role,
      type: message.role === "assistant" && this.looksLikeReport(message.content) ? "report" : "message",
      content: message.content,
      createdAt: message.createdAt.toISOString()
    }));
  }

  private looksLikeReport(content: string) {
    return /report|architecture|quality|snapshot|preview/i.test(content);
  }
}
