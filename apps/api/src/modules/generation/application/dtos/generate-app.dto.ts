import { IsOptional, IsString, MinLength } from "class-validator";

export class GenerateAppDto {
  @IsString()
  @MinLength(4)
  prompt!: string;

  @IsOptional()
  @IsString()
  name?: string;
}
