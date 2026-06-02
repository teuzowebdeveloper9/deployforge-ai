import { Controller, Headers, Inject, Param, Post } from "@nestjs/common";
import { AUTH_PROVIDER, AuthProvider } from "../../../auth/application/ports/auth-provider.port";
import { RequestQualityGateUseCase } from "../../application/use-cases/request-quality-gate.use-case";

@Controller("apps/:appId/versions/:versionId/quality-gate")
export class QualityController {
  constructor(
    @Inject(AUTH_PROVIDER) private readonly auth: AuthProvider,
    private readonly requestQualityGate: RequestQualityGateUseCase
  ) {}

  @Post()
  run(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("appId") appId: string,
    @Param("versionId") versionId: string
  ) {
    return this.requestQualityGate.execute(this.auth.currentUser(headers), appId, versionId);
  }
}
