import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../shared/database/prisma.service";
import { assertAppOwnership } from "../../../../shared/security/app-authorization";
import { AuthenticatedUser } from "../../../auth/application/ports/auth-provider.port";
import { PrismaAgentConversationRepository } from "../../infrastructure/providers/prisma-agent-conversation.repository";

@Injectable()
export class ListAgentStepsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversations: PrismaAgentConversationRepository
  ) {}

  async execute(user: AuthenticatedUser, appId: string) {
    const app = await this.prisma.app.findUnique({ where: { id: appId }, select: { id: true, userId: true } });
    assertAppOwnership(app, user);

    const steps = await this.conversations.listSteps(appId);
    if (!steps) throw new NotFoundException("App not found");
    return steps;
  }
}
