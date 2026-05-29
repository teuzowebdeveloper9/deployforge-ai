import { Controller, Get, Param } from "@nestjs/common";
import { ListBuildsUseCase } from "../../application/use-cases/list-builds.use-case";

@Controller("apps/:appId/builds")
export class BuildsController {
  constructor(private readonly listBuilds: ListBuildsUseCase) {}

  @Get()
  list(@Param("appId") appId: string) {
    return this.listBuilds.execute(appId);
  }
}
