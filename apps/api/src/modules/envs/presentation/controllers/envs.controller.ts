import { Body, Controller, Get, Headers, Inject, Param, Post } from "@nestjs/common";
import { AUTH_PROVIDER, AuthProvider } from "../../../auth/application/ports/auth-provider.port";
import { CreateEnvDto } from "../../application/dtos/create-env.dto";
import { CreateEnvUseCase } from "../../application/use-cases/create-env.use-case";
import { ListEnvsUseCase } from "../../application/use-cases/list-envs.use-case";

@Controller("apps/:appId/envs")
export class EnvsController {
  constructor(
    @Inject(AUTH_PROVIDER) private readonly auth: AuthProvider,
    private readonly listEnvs: ListEnvsUseCase,
    private readonly createEnv: CreateEnvUseCase
  ) {}

  @Get()
  list(@Headers() headers: Record<string, string | string[] | undefined>, @Param("appId") appId: string) {
    return this.listEnvs.execute(this.auth.currentUser(headers), appId);
  }

  @Post()
  create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("appId") appId: string,
    @Body() dto: CreateEnvDto
  ) {
    return this.createEnv.execute(this.auth.currentUser(headers), appId, dto);
  }
}
