import { Controller, Get, Headers, Res, UnauthorizedException } from "@nestjs/common";
import { loadConfig } from "../../shared/config/app.config";
import { bearerToken, getHeader, safeResponseHeader, timingSafeStringEqual } from "../../shared/security/safe-headers";
import { AuthService } from "./auth.service";

@Controller("internal")
export class InternalAuthController {
  private readonly config = loadConfig();

  constructor(private readonly auth: AuthService) {}

  @Get("verify")
  async verify(@Headers() headers: Record<string, string | string[] | undefined>, @Res({ passthrough: true }) response: any) {
    const internalToken = getHeader(headers, "x-internal-auth-token");
    if (!timingSafeStringEqual(internalToken, this.config.gatewayInternalAuthToken)) {
      throw new UnauthorizedException("Internal auth required");
    }

    const token = bearerToken(headers);
    if (!token) throw new UnauthorizedException("Bearer token required");

    const context = await this.auth.verifyBearer(token);
    response.setHeader("X-User-Id", safeResponseHeader(context.userId));
    response.setHeader("X-User-Email", safeResponseHeader(context.email));
    response.setHeader("X-User-Name", safeResponseHeader(context.name));
    response.setHeader("X-Org-Id", safeResponseHeader(context.organizationId));
    response.setHeader("X-Role", safeResponseHeader(context.role));
    response.setHeader("X-Plan", safeResponseHeader(context.plan));
    response.setHeader("X-Session-Id", safeResponseHeader(context.sessionId));
    return { status: "ok" };
  }
}
