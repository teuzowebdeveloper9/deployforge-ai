import { Body, Controller, Param, Post } from "@nestjs/common";
import { AgentMessageDto } from "../../application/dtos/agent-message.dto";
import { SendAgentMessageUseCase } from "../../application/use-cases/send-agent-message.use-case";

@Controller("apps/:appId/agent/messages")
export class AgentsController {
  constructor(private readonly sendMessage: SendAgentMessageUseCase) {}

  @Post()
  send(@Param("appId") appId: string, @Body() dto: AgentMessageDto) {
    return this.sendMessage.execute(appId, dto);
  }
}
