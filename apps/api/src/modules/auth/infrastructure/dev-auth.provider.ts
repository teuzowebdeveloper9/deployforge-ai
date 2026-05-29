import { Injectable } from "@nestjs/common";
import { AuthenticatedUser, AuthProvider } from "../application/ports/auth-provider.port";

@Injectable()
export class DevAuthProvider implements AuthProvider {
  currentUser(headers: Record<string, string | string[] | undefined>): AuthenticatedUser {
    const headerId = headers["x-dev-user-id"];
    const id = Array.isArray(headerId) ? headerId[0] : headerId;
    return {
      id: id || "dev-user",
      email: "dev@deployforge.local",
      name: "DeployForge Dev"
    };
  }
}
