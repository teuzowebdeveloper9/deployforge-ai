# CLAUDE.md

Concise operating notes for Claude/Codex agents in `apps/auth-service`.

## Mission

Maintain the private NestJS authentication service for DeployForge AI. This service issues sessions and gives the gateway trusted identity context; it does not own product authorization beyond identity/org/session validation.

## Current Architecture

- Public auth endpoints:
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`
  - `GET /auth/me`
- Internal gateway endpoint:
  - `GET /internal/verify`
- Health endpoints:
  - `GET /health`
  - `GET /ready`

The gateway calls `/internal/verify` through NGINX `auth_request` and forwards only gateway-derived context to API, agent and runner services.

## Non-Negotiables

- Never edit real `.env` files.
- Never commit secrets.
- Never log passwords, bearer tokens, refresh tokens or signing keys.
- Never store refresh tokens in plaintext.
- Never accept trusted context headers from browser/client requests.
- Never remove refresh-token replay detection.
- Never expose `auth-service` directly as a public Compose port.

## Implementation Rules

- Keep controllers thin.
- Keep auth/session logic in services.
- Keep JWT/password/refresh-token primitives in `src/shared/security`.
- Keep Prisma schema and migrations aligned.
- Use DTO validation for inbound payloads.
- Preserve issuer/audience/session checks on access tokens.
- Preserve refresh-token family revocation on detected reuse.

## Useful Commands

```bash
npm install
npx prisma generate
npm run typecheck
npm run lint
npm test
npm run build
```

Report unavailable tools or environment limits honestly instead of weakening checks.
