export const QUEUE_PORT = Symbol("QUEUE_PORT");

export interface QueueEvent {
  type: string;
  payload: Record<string, unknown>;
  correlationId?: string;
}

export interface QueuePort {
  publish(event: QueueEvent): Promise<void>;
}
