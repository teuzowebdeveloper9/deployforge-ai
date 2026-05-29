import { Injectable } from "@nestjs/common";
import { QueuePort } from "../application/ports/queue.port";

@Injectable()
export class NatsQueueAdapter implements QueuePort {
  async publish(): Promise<void> {
    throw new Error("NATS adapter is planned for the local/open-source event bus profile.");
  }
}
