import { createHmac, timingSafeEqual } from "node:crypto";
import { UnauthorizedException } from "@nestjs/common";
import { AuthServiceConfig } from "../config/app.config";

export interface AccessTokenClaims {
  sub: string;
  email: string;
  name?: string;
  orgId: string;
  role: string;
  plan: string;
  sid: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

export interface AccessTokenInput {
  userId: string;
  email: string;
  name?: string | null;
  organizationId: string;
  role: string;
  plan: string;
  sessionId: string;
}

function base64urlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(unsignedToken: string, secret: string): string {
  return createHmac("sha256", secret).update(unsignedToken).digest("base64url");
}

export function createAccessToken(input: AccessTokenInput, config: AuthServiceConfig): { token: string; expiresAt: Date } {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + config.accessTokenTtlSeconds;
  const header = { alg: "HS256", typ: "JWT" };
  const payload: AccessTokenClaims = {
    sub: input.userId,
    email: input.email,
    ...(input.name ? { name: input.name } : {}),
    orgId: input.organizationId,
    role: input.role,
    plan: input.plan,
    sid: input.sessionId,
    iss: config.jwtIssuer,
    aud: config.jwtAudience,
    iat: now,
    exp
  };
  const unsigned = `${base64urlJson(header)}.${base64urlJson(payload)}`;
  return { token: `${unsigned}.${sign(unsigned, config.jwtSecret)}`, expiresAt: new Date(exp * 1000) };
}

export function verifyAccessToken(token: string, config: AuthServiceConfig): AccessTokenClaims {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new UnauthorizedException("Invalid access token");
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const expected = sign(unsigned, config.jwtSecret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new UnauthorizedException("Invalid access token");
  }

  const header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8")) as { alg?: string; typ?: string };
  if (header.alg !== "HS256" || header.typ !== "JWT") {
    throw new UnauthorizedException("Invalid access token");
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as AccessTokenClaims;
  const now = Math.floor(Date.now() / 1000);
  if (payload.iss !== config.jwtIssuer || payload.aud !== config.jwtAudience || payload.exp <= now) {
    throw new UnauthorizedException("Invalid access token");
  }
  if (!payload.sub || !payload.email || !payload.orgId || !payload.role || !payload.plan || !payload.sid) {
    throw new UnauthorizedException("Invalid access token");
  }
  return payload;
}
