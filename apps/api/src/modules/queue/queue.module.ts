import { Module } from "@nestjs/common";
import { QUEUE_PORT } from "./application/ports/queue.port";
import { BullMQQueueAdapter } from "./infrastructure/bullmq-queue.adapter";

@Module({
  providers: [
    BullMQQueueAdapter,
    {
      provide: QUEUE_PORT,
      useExisting: BullMQQueueAdapter
    }
  ],
  exports: [QUEUE_PORT]
})
export class QueueModule {}
