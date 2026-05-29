import { Injectable } from "@nestjs/common";
import { StoragePort } from "../application/ports/storage.port";

@Injectable()
export class MinioStorageAdapter implements StoragePort {
  async putObject(): Promise<void> {
    throw new Error("MinIO adapter is planned for the local/open-source object storage profile.");
  }

  async getObject(): Promise<Buffer> {
    throw new Error("MinIO adapter is planned for the local/open-source object storage profile.");
  }

  localPath(): string {
    throw new Error("MinIO object storage does not expose runner-readable local filesystem paths.");
  }
}
