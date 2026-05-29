import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateVersionDto } from "../../application/dtos/create-version.dto";
import { CreateVersionUseCase } from "../../application/use-cases/create-version.use-case";
import { ListVersionsUseCase } from "../../application/use-cases/list-versions.use-case";

@Controller("apps/:appId/versions")
export class VersionsController {
  constructor(
    private readonly createVersion: CreateVersionUseCase,
    private readonly listVersions: ListVersionsUseCase
  ) {}

  @Post()
  create(@Param("appId") appId: string, @Body() dto: CreateVersionDto) {
    return this.createVersion.execute(appId, dto);
  }

  @Get()
  list(@Param("appId") appId: string) {
    return this.listVersions.execute(appId);
  }
}
