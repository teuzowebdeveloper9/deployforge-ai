import { Body, Controller, Get, Headers, Inject, NotFoundException, Param, Post, Res } from "@nestjs/common";
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
  async preview(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("appId") appId: string,
    @Res({ passthrough: true }) response: any
  ) {
    const html = await this.generateApp.preview(this.auth.currentUser(headers), appId);
    if (!html) throw new NotFoundException("Preview not found");
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader(
      "Content-Security-Policy",
      [
        "sandbox allow-scripts allow-same-origin",
        "default-src 'none'",
        "script-src 'unsafe-inline'",
        "style-src 'unsafe-inline'",
        "img-src data: blob:",
        "font-src data:",
        "connect-src 'none'",
        "base-uri 'none'",
        "form-action 'none'"
      ].join("; ")
    );
    return html;
  }
}
