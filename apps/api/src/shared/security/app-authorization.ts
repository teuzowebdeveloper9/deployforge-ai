import { NotFoundException } from "@nestjs/common";
import { AuthenticatedUser } from "../../modules/auth/application/ports/auth-provider.port";

export function assertAppOwnership<T extends { userId: string }>(
  app: T | null | undefined,
  user: AuthenticatedUser
): T {
  if (!app || app.userId !== user.id) {
    throw new NotFoundException("App not found");
  }
  return app;
}
