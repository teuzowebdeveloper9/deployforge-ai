import { Injectable } from "@nestjs/common";
import { SecretsPort } from "../application/ports/secrets.port";

@Injectable()
export class AzureKeyVaultSecretsAdapter implements SecretsPort {
  createReference(appId: string, environment: string, key: string): string {
    return `keyvault://deployforge/apps-${appId}-${environment}-${key}`;
  }
}
