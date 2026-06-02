import { Body, Controller, Get, Headers, Inject, Param, Post } from "@nestjs/common";
import { AUTH_PROVIDER, AuthProvider } from "../../../auth/application/ports/auth-provider.port";
import { AgentMessageDto } from "../../application/dtos/agent-message.dto";
import { ListAgentMessagesUseCase } from "../../application/use-cases/list-agent-messages.use-case";
import { ListAgentStepsUseCase } from "../../application/use-cases/list-agent-steps.use-case";
import { SendAgentMessageUseCase } from "../../application/use-cases/send-agent-message.use-case";

@Controller("apps/:appId")
export class AgentsController {
  constructor(
    @Inject(AUTH_PROVIDER) private readonly auth: AuthProvider,
    private readonly sendMessage: SendAgentMessageUseCase,
    private readonly listMessages: ListAgentMessagesUseCase,
    private readonly listSteps: ListAgentStepsUseCase
  ) {}

  @Get("messages")
  messages(@Headers() headers: Record<string, string | string[] | undefined>, @Param("appId") appId: string) {
    return this.listMessages.execute(this.auth.currentUser(headers), appId);
  }

  @Get("agent/messages")
  legacyMessages(@Headers() headers: Record<string, string | string[] | undefined>, @Param("appId") appId: string) {
    return this.listMessages.execute(this.auth.currentUser(headers), appId);
  }

  @Post("messages")
  send(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("appId") appId: string,
    @Body() dto: AgentMessageDto
  ) {
    return this.sendMessage.execute(this.auth.currentUser(headers), appId, dto);
  }

  @Post("agent/messages")
  legacySend(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("appId") appId: string,
    @Body() dto: AgentMessageDto
  ) {
    return this.sendMessage.execute(this.auth.currentUser(headers), appId, dto);
  }

  @Get("steps")
  steps(@Headers() headers: Record<string, string | string[] | undefined>, @Param("appId") appId: string) {
    return this.listSteps.execute(this.auth.currentUser(headers), appId);
  }

  @Get("agent/steps")
  legacySteps(@Headers() headers: Record<string, string | string[] | undefined>, @Param("appId") appId: string) {
    return this.listSteps.execute(this.auth.currentUser(headers), appId);
  }
}
