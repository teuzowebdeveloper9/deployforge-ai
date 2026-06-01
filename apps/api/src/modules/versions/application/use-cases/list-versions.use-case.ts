import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { AuthenticatedUser } from "../../../auth/application/ports/auth-provider.port";
import { VERSIONS_REPOSITORY, VersionsRepository } from "../../domain/repositories/versions.repository";

@Injectable()
export class ListVersionsUseCase {
  constructor(@Inject(VERSIONS_REPOSITORY) private readonly versions: VersionsRepository) {}

  async execute(user: AuthenticatedUser, appId: string) {
    const owner = await this.versions.getAppOwner(appId);
    if (!owner || owner.userId !== user.id) throw new NotFoundException("App not found");
    return this.versions.listByApp(appId);
  }
}
