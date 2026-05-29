export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

export const AUTH_PROVIDER = Symbol("AUTH_PROVIDER");

export interface AuthProvider {
  currentUser(headers: Record<string, string | string[] | undefined>): AuthenticatedUser;
}
