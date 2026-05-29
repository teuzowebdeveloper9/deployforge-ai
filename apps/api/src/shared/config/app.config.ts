export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  redisUrl: string | undefined;
  storageRoot: string;
  runnerServiceUrl: string;
  agentServiceUrl: string;
  corsOrigin: string;
}

function numberFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(): AppConfig {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: numberFromEnv(process.env.PORT, 3001),
    databaseUrl: process.env.DATABASE_URL ?? "",
    redisUrl: process.env.REDIS_URL,
    storageRoot: process.env.STORAGE_ROOT ?? "./storage",
    runnerServiceUrl: process.env.RUNNER_SERVICE_URL ?? "http://localhost:8082",
    agentServiceUrl: process.env.AGENT_SERVICE_URL ?? "http://localhost:8001",
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000"
  };
}
