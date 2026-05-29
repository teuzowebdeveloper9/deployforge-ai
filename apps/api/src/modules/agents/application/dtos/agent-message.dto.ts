import { IsString, MaxLength, MinLength } from "class-validator";

export class AgentMessageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(12000)
  message!: string;
}
