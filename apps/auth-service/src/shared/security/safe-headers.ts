import { timingSafeEqual } from "node:crypto";

export function getHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const value = headers[name.toLowerCase()] ?? headers[name];
  return Array.isArray(value) ? value[0] : value;
}

export function timingSafeStringEqual(actual: string | undefined, expected: string): boolean {
  if (!actual) return false;
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function bearerToken(headers: Record<string, string | string[] | undefined>): string | null {
  const authorization = getHeader(headers, "authorization");
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

export function safeResponseHeader(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/[\r\n]/g, "")
    .slice(0, 240);
}
