import { Injectable } from "@nestjs/common";
import { AuthenticatedUser, AuthProvider } from "../application/ports/auth-provider.port";

@Injectable()
export class EntraExternalIdProvider implements AuthProvider {
  currentUser(): AuthenticatedUser {
    return {
      id: "entra-placeholder-user",
      email: "entra-placeholder@deployforge.local",
      name: "Entra External ID Placeholder"
    };
  }
}
