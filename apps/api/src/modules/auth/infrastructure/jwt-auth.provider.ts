import { Injectable } from "@nestjs/common";
import { AuthenticatedUser, AuthProvider } from "../application/ports/auth-provider.port";

@Injectable()
export class JwtAuthProvider implements AuthProvider {
  currentUser(): AuthenticatedUser {
    return {
      id: "jwt-placeholder-user",
      email: "jwt-placeholder@deployforge.local",
      name: "JWT Placeholder"
    };
  }
}
