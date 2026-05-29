import { BuildEntity } from "../entities/build.entity";

export const BUILDS_REPOSITORY = Symbol("BUILDS_REPOSITORY");

export interface CreateBuildData {
  appId: string;
  versionId: string;
  status: string;
  type: string;
}

export interface CompleteBuildData {
  buildId: string;
  status: string;
  logsPath: string;
  reportPath: string;
}

export interface BuildsRepository {
  create(data: CreateBuildData): Promise<BuildEntity>;
  listByApp(appId: string): Promise<BuildEntity[]>;
  complete(data: CompleteBuildData): Promise<BuildEntity>;
  appendLog(buildId: string, level: string, message: string): Promise<void>;
}
