import { Injectable } from "@nestjs/common";
import { StoragePort } from "../application/ports/storage.port";

@Injectable()
export class AzureBlobStorageAdapter implements StoragePort {
  async putObject(): Promise<void> {
    throw new Error("Azure Blob Storage adapter is planned for cloud deployment.");
  }

  async getObject(): Promise<Buffer> {
    throw new Error("Azure Blob Storage adapter is planned for cloud deployment.");
  }

  localPath(): string {
    throw new Error("Azure Blob Storage does not expose local filesystem paths.");
  }
}
