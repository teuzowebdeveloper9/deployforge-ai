import { Injectable } from "@nestjs/common";
import { QueueEvent, QueuePort } from "../application/ports/queue.port";

@Injectable()
export class AzureServiceBusAdapter implements QueuePort {
  async publish(_event: QueueEvent): Promise<void> {
    throw new Error("Azure Service Bus adapter is planned for cloud deployment.");
  }
}
