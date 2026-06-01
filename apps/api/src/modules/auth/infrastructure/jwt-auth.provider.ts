import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthenticatedUser, AuthProvider } from "../application/ports/auth-provider.port";

@Injectable()
export class JwtAuthProvider implements AuthProvider {
  currentUser(): AuthenticatedUser {
    throw new UnauthorizedException("JWT authentication provider is not configured");
  }
}
