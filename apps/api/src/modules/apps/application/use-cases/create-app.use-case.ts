import { Inject, Injectable } from "@nestjs/common";
import { QueuePort, QUEUE_PORT } from "../../../queue/application/ports/queue.port";
import { AuthenticatedUser } from "../../../auth/application/ports/auth-provider.port";
import { APPS_REPOSITORY, AppsRepository } from "../../domain/repositories/apps.repository";
import { CreateAppDto } from "../dtos/create-app.dto";

@Injectable()
export class CreateAppUseCase {
  constructor(
    @Inject(APPS_REPOSITORY) private readonly apps: AppsRepository,
    @Inject(QUEUE_PORT) private readonly queue: QueuePort
  ) {}

  async execute(user: AuthenticatedUser, dto: CreateAppDto) {
    const app = await this.apps.create({ user, name: dto.name, description: dto.description });
    await this.queue.publish({ type: "APP_CREATED", payload: { appId: app.id, userId: user.id } });
    return app;
  }
}
