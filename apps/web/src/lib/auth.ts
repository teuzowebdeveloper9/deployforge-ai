const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";
const AUTH_URL =
  process.env.NEXT_PUBLIC_AUTH_URL ??
  (API_BASE_URL.endsWith("/api") ? `${API_BASE_URL.slice(0, -4)}/auth` : "/auth");

const SESSION_STORAGE_KEY = "deployforge-auth-session";
const ACCESS_TOKEN_COOKIE_NAME = "deployforge_access_token";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthOrganization {
  id: string;
  name: string;
  plan: string;
}

export interface AuthSession {
  accessToken: string;
  accessTokenExpiresAt: string;
  expiresIn: number;
  refreshToken: string;
  user: AuthUser;
  organization: AuthOrganization;
  role: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name?: string;
  organizationName?: string;
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    return parsed.accessToken && parsed.refreshToken ? parsed : null;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  const maxAge = Math.max(60, session.expiresIn);
  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=${encodeURIComponent(session.accessToken)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const session = await authRequest<AuthSession>("/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
  saveAuthSession(session);
  return session;
}

export async function register(input: RegisterInput): Promise<AuthSession> {
  const session = await authRequest<AuthSession>("/register", {
    method: "POST",
    body: JSON.stringify(input)
  });
  saveAuthSession(session);
  return session;
}

export async function logout() {
  const session = getAuthSession();
  clearAuthSession();

  if (!session?.refreshToken) return;

  try {
    await authRequest("/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken: session.refreshToken })
    });
  } catch {
    // The local session is already cleared; remote revoke failure should not keep the user signed in.
  }
}

export async function ensureAuthSession(): Promise<AuthSession | null> {
  const session = getAuthSession();
  if (!session) return null;

  const expiresAt = Date.parse(session.accessTokenExpiresAt);
  if (Number.isFinite(expiresAt) && expiresAt - Date.now() > 60_000) {
    return session;
  }

  return refreshAuthSession(session);
}

export async function verifyAuthSession(): Promise<AuthSession | null> {
  const session = await ensureAuthSession();
  if (!session) return null;

  try {
    await authRequest("/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${session.accessToken}` }
    });
    return session;
  } catch {
    clearAuthSession();
    return null;
  }
}

async function refreshAuthSession(session: AuthSession): Promise<AuthSession | null> {
  try {
    const refreshed = await authRequest<AuthSession>("/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: session.refreshToken })
    });
    saveAuthSession(refreshed);
    return refreshed;
  } catch {
    clearAuthSession();
    return null;
  }
}

async function authRequest<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${AUTH_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(readErrorMessage(message, `Auth request failed with ${response.status}`));
  }

  return (await response.json()) as T;
}

function readErrorMessage(raw: string, fallback: string) {
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as { message?: string | string[] };
    if (Array.isArray(parsed.message)) return parsed.message.join(", ");
    return parsed.message ?? fallback;
  } catch {
    return raw;
  }
}
