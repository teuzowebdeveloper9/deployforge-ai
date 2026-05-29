import { AppVersionEntity } from "../entities/app-version.entity";

export const VERSIONS_REPOSITORY = Symbol("VERSIONS_REPOSITORY");

export interface CreateVersionData {
  id: string;
  appId: string;
  versionNumber: number;
  storagePath: string;
  checksum: string;
  createdBy: string;
}

export interface AppOwner {
  appId: string;
  userId: string;
}

export interface VersionsRepository {
  getAppOwner(appId: string): Promise<AppOwner | null>;
  nextVersionNumber(appId: string): Promise<number>;
  create(data: CreateVersionData): Promise<AppVersionEntity>;
  listByApp(appId: string): Promise<AppVersionEntity[]>;
  findById(appId: string, versionId: string): Promise<AppVersionEntity | null>;
  updateQualityScore(versionId: string, score: number, status: string): Promise<void>;
}
