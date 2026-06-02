import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthenticatedUser, AuthProvider } from "../application/ports/auth-provider.port";

@Injectable()
export class DevAuthProvider implements AuthProvider {
  currentUser(headers: Record<string, string | string[] | undefined>): AuthenticatedUser {
    if ((process.env.NODE_ENV ?? "development") === "production") {
      throw new UnauthorizedException("Dev authentication is disabled in production");
    }

    const headerId = headers["x-dev-user-id"];
    const id = Array.isArray(headerId) ? headerId[0] : headerId;
    if (id && !/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
      throw new UnauthorizedException("Invalid dev user id");
    }

    return {
      id: id || "dev-user",
      email: "dev@deployforge.local",
      name: "DeployForge Dev"
    };
  }
}
