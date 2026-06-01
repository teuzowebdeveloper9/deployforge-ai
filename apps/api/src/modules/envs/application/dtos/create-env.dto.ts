import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateEnvDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9_-]*$/)
  @MinLength(2)
  @MaxLength(40)
  environment!: string;

  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]*$/)
  @MaxLength(120)
  key!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z][a-z0-9+.-]*:\/\/[A-Za-z0-9._~:/@%+=,-]+$/)
  @MaxLength(300)
  secretReference?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}
