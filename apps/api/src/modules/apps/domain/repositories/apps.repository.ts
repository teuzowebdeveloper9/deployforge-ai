import { AuthenticatedUser } from "../../../auth/application/ports/auth-provider.port";
import { AppEntity } from "../entities/app.entity";

export const APPS_REPOSITORY = Symbol("APPS_REPOSITORY");

export interface CreateAppData {
  user: AuthenticatedUser;
  name: string;
  description?: string;
}

export interface AppsRepository {
  create(data: CreateAppData): Promise<AppEntity>;
  findById(appId: string): Promise<AppEntity | null>;
  listByUser(userId: string): Promise<AppEntity[]>;
}
