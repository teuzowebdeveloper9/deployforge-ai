import { Body, Controller, Get, Headers, Inject, Param, Post } from "@nestjs/common";
import { AUTH_PROVIDER, AuthProvider } from "../../../auth/application/ports/auth-provider.port";
import { CreateAppDto } from "../../application/dtos/create-app.dto";
import { CreateAppUseCase } from "../../application/use-cases/create-app.use-case";
import { GetAppUseCase } from "../../application/use-cases/get-app.use-case";
import { ListAppsUseCase } from "../../application/use-cases/list-apps.use-case";

@Controller("apps")
export class AppsController {
  constructor(
    @Inject(AUTH_PROVIDER) private readonly auth: AuthProvider,
    private readonly createApp: CreateAppUseCase,
    private readonly listApps: ListAppsUseCase,
    private readonly getApp: GetAppUseCase
  ) {}

  @Post()
  create(@Headers() headers: Record<string, string | string[] | undefined>, @Body() dto: CreateAppDto) {
    return this.createApp.execute(this.auth.currentUser(headers), dto);
  }

  @Get()
  list(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.listApps.execute(this.auth.currentUser(headers));
  }

  @Get(":appId")
  get(@Param("appId") appId: string) {
    return this.getApp.execute(appId);
  }
}
