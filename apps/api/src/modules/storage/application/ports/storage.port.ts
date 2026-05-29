export const STORAGE_PORT = Symbol("STORAGE_PORT");

export interface StoragePort {
  putObject(path: string, data: Buffer | string, contentType?: string): Promise<void>;
  getObject(path: string): Promise<Buffer>;
  localPath(path: string): string;
}
