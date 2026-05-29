import { Injectable } from "@nestjs/common";
import { AuthenticatedUser, AuthProvider } from "../application/ports/auth-provider.port";

@Injectable()
export class OidcAuthProvider implements AuthProvider {
  currentUser(): AuthenticatedUser {
    return {
      id: "oidc-placeholder-user",
      email: "oidc-placeholder@deployforge.local",
      name: "OIDC Placeholder"
    };
  }
}
