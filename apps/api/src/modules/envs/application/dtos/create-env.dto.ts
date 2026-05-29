import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateEnvDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  environment!: string;

  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]*$/)
  @MaxLength(120)
  key!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  secretReference?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}
