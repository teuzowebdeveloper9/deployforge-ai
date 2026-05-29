import { Injectable } from "@nestjs/common";
import { SecretsPort } from "../application/ports/secrets.port";

@Injectable()
export class LocalSecretsAdapter implements SecretsPort {
  createReference(appId: string, environment: string, key: string): string {
    return `local://apps/${appId}/envs/${environment}/${key}`;
  }
}
