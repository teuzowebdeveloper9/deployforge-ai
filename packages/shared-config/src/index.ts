export interface ServiceRuntimeConfig {
  serviceName: string;
  environment: "development" | "test" | "production";
  port: number;
}

export function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
