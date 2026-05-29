import { Module } from "@nestjs/common";
import { STORAGE_PORT } from "./application/ports/storage.port";
import { SnapshotService } from "./application/services/snapshot.service";
import { LocalStorageAdapter } from "./infrastructure/local-storage.adapter";

@Module({
  providers: [
    SnapshotService,
    LocalStorageAdapter,
    {
      provide: STORAGE_PORT,
      useExisting: LocalStorageAdapter
    }
  ],
  exports: [STORAGE_PORT, SnapshotService]
})
export class StorageModule {}
