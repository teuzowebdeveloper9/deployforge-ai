import { Inject, Injectable } from "@nestjs/common";
import { BUILDS_REPOSITORY, BuildsRepository } from "../../domain/repositories/builds.repository";

@Injectable()
export class ListBuildsUseCase {
  constructor(@Inject(BUILDS_REPOSITORY) private readonly builds: BuildsRepository) {}

  execute(appId: string) {
    return this.builds.listByApp(appId);
  }
}
