import { Injectable } from "@nestjs/common";
import { PrismaEnvsRepository } from "../../infrastructure/persistence/prisma-envs.repository";

@Injectable()
export class ListEnvsUseCase {
  constructor(private readonly envs: PrismaEnvsRepository) {}

  execute(appId: string) {
    return this.envs.list(appId);
  }
}
