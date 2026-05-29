import { Inject, Injectable } from "@nestjs/common";
import { VERSIONS_REPOSITORY, VersionsRepository } from "../../domain/repositories/versions.repository";

@Injectable()
export class ListVersionsUseCase {
  constructor(@Inject(VERSIONS_REPOSITORY) private readonly versions: VersionsRepository) {}

  execute(appId: string) {
    return this.versions.listByApp(appId);
  }
}
