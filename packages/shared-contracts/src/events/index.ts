export const DeployForgeEvents = {
  APP_CREATED: "APP_CREATED",
  APP_VERSION_CREATED: "APP_VERSION_CREATED",
  QUALITY_GATE_REQUESTED: "QUALITY_GATE_REQUESTED",
  QUALITY_GATE_COMPLETED: "QUALITY_GATE_COMPLETED",
  AGENT_RUN_REQUESTED: "AGENT_RUN_REQUESTED",
  AGENT_RUN_STARTED: "AGENT_RUN_STARTED",
  AGENT_RUN_COMPLETED: "AGENT_RUN_COMPLETED",
  PREVIEW_REQUESTED: "PREVIEW_REQUESTED",
  PREVIEW_CREATED: "PREVIEW_CREATED",
  ROLLBACK_REQUESTED: "ROLLBACK_REQUESTED"
} as const;

export type DeployForgeEventType = (typeof DeployForgeEvents)[keyof typeof DeployForgeEvents];

export interface DomainEvent<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  type: DeployForgeEventType;
  occurredAt: string;
  correlationId: string;
  payload: TPayload;
}
