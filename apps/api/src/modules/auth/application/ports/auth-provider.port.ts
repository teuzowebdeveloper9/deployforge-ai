export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  orgId?: string;
  role?: string;
  plan?: string;
  sessionId?: string;
}

export const AUTH_PROVIDER = Symbol("AUTH_PROVIDER");

export interface AuthProvider {
  currentUser(headers: Record<string, string | string[] | undefined>): AuthenticatedUser;
}
