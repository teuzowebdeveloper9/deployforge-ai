import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class GenerateAppDto {
  @IsString()
  @MinLength(4)
  @MaxLength(12000)
  prompt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;
}
