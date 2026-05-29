import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";
import { randomUUID } from "node:crypto";
import { loadConfig } from "../../../shared/config/app.config";
import { QueueEvent, QueuePort } from "../application/ports/queue.port";

@Injectable()
export class BullMQQueueAdapter implements QueuePort, OnModuleDestroy {
  private readonly queue?: Queue;

  constructor() {
    const redisUrl = loadConfig().redisUrl;
    if (redisUrl) {
      this.queue = new Queue("deployforge-events", { connection: this.parseRedisConnection(redisUrl) });
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
  }

  private parseRedisConnection(redisUrl: string) {
    const parsed = new URL(redisUrl);
    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 6379,
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      maxRetriesPerRequest: null
    };
  }
}
