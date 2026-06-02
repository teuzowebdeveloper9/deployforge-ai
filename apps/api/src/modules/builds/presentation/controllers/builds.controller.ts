import { Controller, Get, Headers, Inject, Param } from "@nestjs/common";
import { AUTH_PROVIDER, AuthProvider } from "../../../auth/application/ports/auth-provider.port";
import { ListBuildsUseCase } from "../../application/use-cases/list-builds.use-case";

@Controller("apps/:appId/builds")
export class BuildsController {
  constructor(
    @Inject(AUTH_PROVIDER) private readonly auth: AuthProvider,
    private readonly listBuilds: ListBuildsUseCase
  ) {}

  @Get()
  list(@Headers() headers: Record<string, string | string[] | undefined>, @Param("appId") appId: string) {
    return this.listBuilds.execute(this.auth.currentUser(headers), appId);
  }
}
