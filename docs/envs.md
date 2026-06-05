# Envs And Secrets

Only `.env.example` files are allowed in the repository. Do not create or edit real `.env` files.

## Rules

- Never commit secrets.
- Never save real secret values in PostgreSQL.
- Never return secret values to the frontend.
- Never log secrets.
- Never edit `.env`, `.env.local`, `.env.production`, `.env.test` or any real `.env.*`.
- Use `secret_reference` for local, Vault, SOPS or Sealed Secrets references.

## Service Examples

Each service includes a `.env.example` with safe placeholders.

Current templates:

```txt
apps/web/.env.example
apps/auth-service/.env.example
apps/api/.env.example
apps/agent-service/.env.example
apps/runner-service/.env.example
```

## Local/Open-Source Runtime

In the MVP, Docker Compose injects local development values and the database stores only `secret_reference` metadata. Gateway/auth shared tokens such as `GATEWAY_INTERNAL_AUTH_TOKEN` and `GATEWAY_SERVICE_TOKEN` must be supplied from runtime configuration outside source control for non-local deployments.

Planned secret options:

- Vault for runtime secret retrieval.
- SOPS or Sealed Secrets for encrypted configuration later.

Do not hardcode registry, storage, queue or AI provider credentials in source code.
