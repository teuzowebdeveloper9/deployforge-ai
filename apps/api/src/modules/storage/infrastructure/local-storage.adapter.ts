import { Injectable } from "@nestjs/common";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../../../shared/config/app.config";
import { StoragePort } from "../application/ports/storage.port";

@Injectable()
export class LocalStorageAdapter implements StoragePort {
  private readonly root = path.resolve(loadConfig().storageRoot);

  async putObject(objectPath: string, data: Buffer | string): Promise<void> {
    const fullPath = this.localPath(objectPath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, data);
  }

  async getObject(objectPath: string): Promise<Buffer> {
    return readFile(this.localPath(objectPath));
  }

  localPath(objectPath: string): string {
    const fullPath = path.resolve(this.root, objectPath);
    const relative = path.relative(this.root, fullPath);
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error("Storage path escapes storage root");
    }
    return fullPath;
  }
}
