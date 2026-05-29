# Envs And Secrets

Only `.env.example` files are allowed in the repository. Do not create or edit real `.env` files.

## Rules

- Never commit secrets.
- Never save real secret values in PostgreSQL.
- Never return secret values to the frontend.
- Never log secrets.
- Never edit `.env`, `.env.local`, `.env.production`, `.env.test` or any real `.env.*`.
- Use `secret_reference` for local or Azure Key Vault references.

## Service Examples

Each service includes a `.env.example` with safe placeholders.

## Azure

In Azure, secret values belong in Azure Key Vault. Services should use Managed Identity and RBAC to resolve values at runtime.
