import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../shared/database/prisma.service";

@Injectable()
export class PrismaAgentConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveMessage(appId: string, role: "user" | "assistant", content: string) {
    return this.prisma.agentMessage.create({ data: { appId, role, content } });
  }

  async startRun(appId: string, prompt: string) {
    return this.prisma.agentRun.create({
      data: {
        appId,
        prompt,
        status: "RUNNING"
      }
    });
  }

  async finishRun(runId: string, status: string, response: string) {
    return this.prisma.agentRun.update({
      where: { id: runId },
      data: {
        status,
        response,
        finishedAt: new Date()
      }
    });
  }
}
