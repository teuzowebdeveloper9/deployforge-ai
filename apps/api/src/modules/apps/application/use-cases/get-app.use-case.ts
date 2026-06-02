import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { assertAppOwnership } from "../../../../shared/security/app-authorization";
import { AuthenticatedUser } from "../../../auth/application/ports/auth-provider.port";
import { APPS_REPOSITORY, AppsRepository } from "../../domain/repositories/apps.repository";

@Injectable()
export class GetAppUseCase {
  constructor(@Inject(APPS_REPOSITORY) private readonly apps: AppsRepository) {}

  async execute(user: AuthenticatedUser, appId: string) {
    const app = await this.apps.findById(appId);
    if (!app) throw new NotFoundException("App not found");
    return assertAppOwnership(app, user);
  }
}
