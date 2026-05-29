import { Inject, Injectable } from "@nestjs/common";
import { AuthenticatedUser } from "../../../auth/application/ports/auth-provider.port";
import { APPS_REPOSITORY, AppsRepository } from "../../domain/repositories/apps.repository";

@Injectable()
export class ListAppsUseCase {
  constructor(@Inject(APPS_REPOSITORY) private readonly apps: AppsRepository) {}

  async execute(user: AuthenticatedUser) {
    return this.apps.listByUser(user.id);
  }
}
