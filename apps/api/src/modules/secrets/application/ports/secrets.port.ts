export const SECRETS_PORT = Symbol("SECRETS_PORT");

export interface SecretsPort {
  createReference(appId: string, environment: string, key: string): string;
}
