import { Inject, Injectable } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import * as tar from "tar";
import { STORAGE_PORT, StoragePort } from "../ports/storage.port";

export interface SnapshotFile {
  path: string;
  content: string;
}

export interface CreateSnapshotInput {
  userId: string;
  appId: string;
  versionId: string;
  versionNumber: number;
  files?: SnapshotFile[];
}

export interface SnapshotResult {
  storagePath: string;
  manifestPath: string;
  checksumPath: string;
  checksum: string;
}

@Injectable()
export class SnapshotService {
  constructor(@Inject(STORAGE_PORT) private readonly storage: StoragePort) {}

  async createSnapshot(input: CreateSnapshotInput): Promise<SnapshotResult> {
    const basePath = `users/${input.userId}/apps/${input.appId}/versions/${input.versionId}`;
    const storagePath = `${basePath}/source.tar.gz`;
    const manifestPath = `${basePath}/manifest.json`;
    const checksumPath = `${basePath}/checksum.sha256`;
    const tempDir = path.join(os.tmpdir(), `deployforge-${randomUUID()}`);

    await mkdir(tempDir, { recursive: true });

    try {
      const files = input.files && input.files.length > 0 ? input.files : this.defaultFiles(input.versionNumber);
      if (files.length > 64) {
        throw new Error("Snapshot contains too many files");
      }
      const totalSize = files.reduce((sum, file) => sum + file.content.length, 0);
      if (totalSize > 1_000_000) {
        throw new Error("Snapshot is too large");
      }

      for (const file of files) {
        const safeRelative = this.safeRelativePath(file.path);
        const fullPath = path.join(tempDir, safeRelative);
        const relativeToTemp = path.relative(tempDir, fullPath);
        if (relativeToTemp === ".." || relativeToTemp.startsWith(`..${path.sep}`) || path.isAbsolute(relativeToTemp)) {
          throw new Error("Snapshot file path escapes workspace");
        }
        await mkdir(path.dirname(fullPath), { recursive: true });
        await writeFile(fullPath, file.content);
      }

      const archivePath = this.storage.localPath(storagePath);
      await mkdir(path.dirname(archivePath), { recursive: true });
      await tar.c({ gzip: true, cwd: tempDir, file: archivePath }, ["."]);

      const archive = await this.storage.getObject(storagePath);
      const checksum = createHash("sha256").update(archive).digest("hex");
      const manifest = {
        appId: input.appId,
        versionId: input.versionId,
        versionNumber: input.versionNumber,
        fileCount: files.length,
        createdAt: new Date().toISOString()
      };

      await this.storage.putObject(manifestPath, JSON.stringify(manifest, null, 2), "application/json");
      await this.storage.putObject(checksumPath, `${checksum}\n`, "text/plain");

      return { storagePath, manifestPath, checksumPath, checksum };
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }

  private safeRelativePath(filePath: string): string {
    const normalized = path.posix.normalize(filePath.replaceAll("\\", "/").trim());
    if (!normalized || normalized === "." || normalized.startsWith("../") || normalized === ".." || path.posix.isAbsolute(normalized)) {
      throw new Error("Snapshot file path escapes workspace");
    }
    const blocked = new Set([".git", "node_modules", "dist", "build", ".next"]);
    if (normalized.split("/").some((part) => part.startsWith(".env") || blocked.has(part))) {
      throw new Error("Snapshot contains a forbidden file path");
    }
    return normalized;
  }

  private defaultFiles(versionNumber: number): SnapshotFile[] {
    return [
      {
        path: "package.json",
        content: JSON.stringify(
          {
            name: `deployforge-generated-v${versionNumber}`,
            version: "0.1.0",
            private: true,
            scripts: {
              lint: "node -e \"console.log('lint ok')\"",
              typecheck: "node -e \"console.log('typecheck ok')\"",
              test: "node -e \"console.log('test ok')\"",
              build: "node -e \"console.log('build ok')\""
            }
          },
          null,
          2
        )
      },
      {
        path: "README.md",
        content: "# Generated DeployForge Snapshot\n\nThis is a safe MVP snapshot generated for quality-gate testing.\n"
      },
      {
        path: "src/index.ts",
        content: "export const status = 'ok';\n"
      }
    ];
  }
}
