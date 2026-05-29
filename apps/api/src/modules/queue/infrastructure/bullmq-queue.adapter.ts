import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { randomUUID } from "node:crypto";
import { loadConfig } from "../../../shared/config/app.config";
import { QueueEvent, QueuePort } from "../application/ports/queue.port";

@Injectable()
export class BullMQQueueAdapter implements QueuePort, OnModuleDestroy {
  private readonly queue?: Queue;
  private readonly connection?: IORedis;

  constructor() {
    const redisUrl = loadConfig().redisUrl;
    if (redisUrl) {
      this.connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
      this.queue = new Queue("deployforge-events", { connection: this.connection });
    }
  }

  async publish(event: QueueEvent): Promise<void> {
    if (!this.queue) return;
    await this.queue.add(event.type, {
      id: randomUUID(),
      occurredAt: new Date().toISOString(),
      correlationId: event.correlationId ?? randomUUID(),
      ...event
    });
  }

  async onModuleDestroy() {
    await this.queue?.close();
    this.connection?.disconnect();
  }
}
