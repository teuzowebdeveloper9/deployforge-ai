import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthenticatedUser, AuthProvider } from "../application/ports/auth-provider.port";

@Injectable()
export class OidcAuthProvider implements AuthProvider {
  currentUser(): AuthenticatedUser {
    throw new UnauthorizedException("OIDC authentication provider is not configured");
  }
}
