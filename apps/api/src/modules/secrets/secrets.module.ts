import { Module } from "@nestjs/common";
import { SECRETS_PORT } from "./application/ports/secrets.port";
import { LocalSecretsAdapter } from "./infrastructure/local-secrets.adapter";

@Module({
  providers: [
    LocalSecretsAdapter,
    {
      provide: SECRETS_PORT,
      useExisting: LocalSecretsAdapter
    }
  ],
  exports: [SECRETS_PORT]
})
export class SecretsModule {}
