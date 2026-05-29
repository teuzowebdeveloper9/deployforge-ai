import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { AgentMessageDto } from "../../application/dtos/agent-message.dto";
import { ListAgentMessagesUseCase } from "../../application/use-cases/list-agent-messages.use-case";
import { ListAgentStepsUseCase } from "../../application/use-cases/list-agent-steps.use-case";
import { SendAgentMessageUseCase } from "../../application/use-cases/send-agent-message.use-case";

@Controller("apps/:appId")
export class AgentsController {
  constructor(
    private readonly sendMessage: SendAgentMessageUseCase,
    private readonly listMessages: ListAgentMessagesUseCase,
    private readonly listSteps: ListAgentStepsUseCase
  ) {}

  @Get("messages")
  messages(@Param("appId") appId: string) {
    return this.listMessages.execute(appId);
  }

  @Get("agent/messages")
  legacyMessages(@Param("appId") appId: string) {
    return this.listMessages.execute(appId);
  }

  @Post("messages")
  send(@Param("appId") appId: string, @Body() dto: AgentMessageDto) {
    return this.sendMessage.execute(appId, dto);
  }

  @Post("agent/messages")
  legacySend(@Param("appId") appId: string, @Body() dto: AgentMessageDto) {
    return this.sendMessage.execute(appId, dto);
  }

  @Get("steps")
  steps(@Param("appId") appId: string) {
    return this.listSteps.execute(appId);
  }

  @Get("agent/steps")
  legacySteps(@Param("appId") appId: string) {
    return this.listSteps.execute(appId);
  }
}
