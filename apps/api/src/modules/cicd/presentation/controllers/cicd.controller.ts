import { Body, Controller, Headers, Inject, Param, Post } from "@nestjs/common";
import { AUTH_PROVIDER, AuthProvider } from "../../../auth/application/ports/auth-provider.port";
import { RunCiCdDto } from "../../application/dtos/run-cicd.dto";
import { RunCiCdUseCase } from "../../application/use-cases/run-cicd.use-case";

@Controller("apps/:appId/ci-cd")
export class CiCdController {
  constructor(
    @Inject(AUTH_PROVIDER) private readonly auth: AuthProvider,
    private readonly runCiCd: RunCiCdUseCase
  ) {}

  @Post()
  run(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("appId") appId: string,
    @Body() dto: RunCiCdDto
  ): Promise<unknown> {
    return this.runCiCd.execute(this.auth.currentUser(headers), appId, dto);
  }
}
