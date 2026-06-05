import { Injectable, UnauthorizedException } from "@nestjs/common";
import { timingSafeEqual } from "node:crypto";
import { loadConfig } from "../../../shared/config/app.config";
import { AuthenticatedUser, AuthProvider } from "../application/ports/auth-provider.port";

@Injectable()
export class GatewayAuthProvider implements AuthProvider {
  private readonly config = loadConfig();

  currentUser(headers: Record<string, string | string[] | undefined>): AuthenticatedUser {
    if (!this.config.gatewayServiceToken || !this.safeEqual(this.header(headers, "x-gateway-token"), this.config.gatewayServiceToken)) {
      throw new UnauthorizedException("Gateway authentication required");
    }

    const id = this.requiredHeader(headers, "x-user-id");
    const email = this.header(headers, "x-user-email") ?? `${id}@gateway.deployforge.local`;
    const name = this.header(headers, "x-user-name") ?? "Gateway User";

    return {
      id,
      email,
      name,
      orgId: this.header(headers, "x-org-id"),
      role: this.header(headers, "x-role"),
      plan: this.header(headers, "x-plan"),
      sessionId: this.header(headers, "x-session-id")
    };
  }

  private requiredHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = this.header(headers, name);
    if (!value) throw new UnauthorizedException("Authenticated user context is missing");
    if (!/^[A-Za-z0-9_.@:-]{1,240}$/.test(value)) {
      throw new UnauthorizedException("Authenticated user context is invalid");
    }
    return value;
  }

  private header(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
    const value = headers[name] ?? headers[name.toLowerCase()];
    const selected = Array.isArray(value) ? value[0] : value;
    return selected?.replace(/[\r\n]/g, "").slice(0, 240);
  }

  private safeEqual(actual: string | undefined, expected: string): boolean {
    if (!actual) return false;
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);
    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
  }
}
