import { Injectable } from "@nestjs/common";
import { SecretsPort } from "../application/ports/secrets.port";

@Injectable()
export class VaultSecretsAdapter implements SecretsPort {
  createReference(appId: string, environment: string, key: string): string {
    return `vault://deployforge/apps/${appId}/${environment}/${key}`;
  }
}
