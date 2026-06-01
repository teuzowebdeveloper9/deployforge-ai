import { Body, Controller, Get, Headers, Inject, Param, Post } from "@nestjs/common";
import { AUTH_PROVIDER, AuthProvider } from "../../../auth/application/ports/auth-provider.port";
import { CreateVersionDto } from "../../application/dtos/create-version.dto";
import { CreateVersionUseCase } from "../../application/use-cases/create-version.use-case";
import { ListVersionsUseCase } from "../../application/use-cases/list-versions.use-case";

@Controller("apps/:appId/versions")
export class VersionsController {
  constructor(
    @Inject(AUTH_PROVIDER) private readonly auth: AuthProvider,
    private readonly createVersion: CreateVersionUseCase,
    private readonly listVersions: ListVersionsUseCase
  ) {}

  @Post()
  create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("appId") appId: string,
    @Body() dto: CreateVersionDto
  ) {
    return this.createVersion.execute(this.auth.currentUser(headers), appId, dto);
  }

  @Get()
  list(@Headers() headers: Record<string, string | string[] | undefined>, @Param("appId") appId: string) {
    return this.listVersions.execute(this.auth.currentUser(headers), appId);
  }
}
