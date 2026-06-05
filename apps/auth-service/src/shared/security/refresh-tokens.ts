import { createHmac, randomBytes } from "node:crypto";

export function createRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

export function hashRefreshToken(token: string, pepper: string): string {
  return createHmac("sha256", pepper).update(token).digest("hex");
}
