import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateEnvDto } from "../../application/dtos/create-env.dto";
import { CreateEnvUseCase } from "../../application/use-cases/create-env.use-case";
import { ListEnvsUseCase } from "../../application/use-cases/list-envs.use-case";

@Controller("apps/:appId/envs")
export class EnvsController {
  constructor(
    private readonly listEnvs: ListEnvsUseCase,
    private readonly createEnv: CreateEnvUseCase
  ) {}

  @Get()
  list(@Param("appId") appId: string) {
    return this.listEnvs.execute(appId);
  }

  @Post()
  create(@Param("appId") appId: string, @Body() dto: CreateEnvDto) {
    return this.createEnv.execute(appId, dto);
  }
}
