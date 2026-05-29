import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { APPS_REPOSITORY, AppsRepository } from "../../domain/repositories/apps.repository";

@Injectable()
export class GetAppUseCase {
  constructor(@Inject(APPS_REPOSITORY) private readonly apps: AppsRepository) {}

  async execute(appId: string) {
    const app = await this.apps.findById(appId);
    if (!app) throw new NotFoundException("App not found");
    return app;
  }
}
