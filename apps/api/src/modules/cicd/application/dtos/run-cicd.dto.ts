import { IsBoolean, IsOptional, IsString } from "class-validator";

export class RunCiCdDto {
  @IsOptional()
  @IsString()
  versionId?: string;

  @IsOptional()
  @IsBoolean()
  autoFix?: boolean;
}
