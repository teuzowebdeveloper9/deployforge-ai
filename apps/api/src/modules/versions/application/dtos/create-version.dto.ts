import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class SnapshotFileDto {
  @IsString()
  @MaxLength(200)
  path!: string;

  @IsString()
  @MaxLength(200000)
  content!: string;
}

export class CreateVersionDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  createdBy?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(32)
  @ValidateNested({ each: true })
  @Type(() => SnapshotFileDto)
  files?: SnapshotFileDto[];
}
