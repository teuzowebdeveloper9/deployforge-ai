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

## Local/Open-Source Runtime

In the MVP, Docker Compose injects local development values and the database stores only `secret_reference` metadata.

Planned secret options:

- Vault for runtime secret retrieval.
- SOPS or Sealed Secrets for encrypted configuration later.

Do not hardcode registry, storage, queue, Mistral or provider credentials in source code.
