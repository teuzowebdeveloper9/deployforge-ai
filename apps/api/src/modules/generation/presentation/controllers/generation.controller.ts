import { Body, Controller, Get, Header, Headers, Inject, NotFoundException, Param, Post } from "@nestjs/common";
import { AUTH_PROVIDER, AuthProvider } from "../../../auth/application/ports/auth-provider.port";
import { GenerateAppDto } from "../../application/dtos/generate-app.dto";
import { GenerateAppUseCase } from "../../application/use-cases/generate-app.use-case";

@Controller()
export class GenerationController {
  constructor(
    @Inject(AUTH_PROVIDER) private readonly auth: AuthProvider,
    private readonly generateApp: GenerateAppUseCase
  ) {}

  @Post("apps/generate")
  generate(@Headers() headers: Record<string, string | string[] | undefined>, @Body() dto: GenerateAppDto) {
    return this.generateApp.execute(this.auth.currentUser(headers), dto);
  }

  @Get("apps/:appId/preview")
  @Header("Content-Type", "text/html; charset=utf-8")
  async preview(@Param("appId") appId: string) {
    const html = await this.generateApp.preview(appId);
    if (!html) throw new NotFoundException("Preview not found");
    return html;
  }
}
