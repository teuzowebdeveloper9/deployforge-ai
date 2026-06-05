export interface AuthServiceConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtIssuer: string;
  jwtAudience: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlDays: number;
  refreshTokenPepper: string;
  gatewayInternalAuthToken: string;
}

function numberFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function configuredSecret(name: string, fallback: string, nodeEnv: string): string {
  const value = process.env[name] ?? fallback;
  if (nodeEnv === "production" && value.includes("replace_me")) {
    throw new Error(`${name} must be configured in production`);
  }
  return value;
}

export function loadConfig(): AuthServiceConfig {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  return {
    nodeEnv,
    port: numberFromEnv(process.env.PORT, 3003),
    databaseUrl: process.env.DATABASE_URL ?? "",
    jwtSecret: configuredSecret("JWT_ACCESS_TOKEN_SECRET", "replace_me_dev_access_token_secret_32_bytes", nodeEnv),
    jwtIssuer: process.env.JWT_ISSUER ?? "deployforge-auth",
    jwtAudience: process.env.JWT_AUDIENCE ?? "deployforge-gateway",
    accessTokenTtlSeconds: numberFromEnv(process.env.ACCESS_TOKEN_TTL_SECONDS, 900),
    refreshTokenTtlDays: numberFromEnv(process.env.REFRESH_TOKEN_TTL_DAYS, 30),
    refreshTokenPepper: configuredSecret("REFRESH_TOKEN_PEPPER", "replace_me_dev_refresh_token_pepper_32_bytes", nodeEnv),
    gatewayInternalAuthToken: configuredSecret("GATEWAY_INTERNAL_AUTH_TOKEN", "replace_me_gateway_internal_auth_token", nodeEnv)
  };
}
