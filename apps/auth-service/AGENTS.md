# AGENTS.md

Guidance for AI coding agents working inside `apps/auth-service`.

## Service Responsibility

`auth-service` owns DeployForge AI authentication:

- user registration and login
- access token issuing
- refresh token rotation
- logout/session revocation
- gateway verification through `/internal/verify`
- trusted user/org context returned to the NGINX gateway

It must run only on the private Docker network behind the public gateway.

## Boundary Rules

- Do not expose this service directly to the host in Docker Compose.
- Keep `/internal/verify` for gateway `auth_request` only.
- Require `X-Internal-Auth-Token` on internal verification routes.
- Never trust client-supplied `X-User-*`, `X-Org-*`, `X-Role`, `X-Plan`, `X-Session-Id` or `X-Gateway-Token` headers.
- Return trusted auth context only after validating the access token and active session.
- Keep authorization/ownership checks in downstream services; this service provides identity and org context.

## Token And Secret Rules

- Never store refresh tokens in plaintext.
- Store refresh tokens only as HMAC hashes.
- Rotate refresh tokens on every refresh.
- Revoke the whole token family when a revoked refresh token is reused.
- Never log passwords, refresh tokens, access tokens, auth headers or signing secrets.
- Never commit real `.env` files or real secret values.
- Only update `.env.example` and docs for configuration changes.

## Layering Rules

- Controllers translate HTTP requests and responses only.
- Business rules live in `auth.service.ts` or focused service helpers.
- Prisma access goes through the service/database layer.
- Security primitives live under `src/shared/security`.
- Configuration parsing lives under `src/shared/config`.
- Keep DTO validation at the transport boundary.
- Keep migrations in `prisma/migrations` and avoid ad hoc schema drift.

## Quality Rules

- Do not remove validation, token rotation, replay detection or header checks to make tests pass.
- Add or update focused tests when changing JWT claims, refresh rotation, password hashing or gateway verification behavior.
- Run at least:

```bash
npm run typecheck
npm run lint
npm test
```

If a command cannot run in the local environment, report the reason clearly.

## Prohibited Actions

- Do not add business logic to controllers.
- Do not add public routes that bypass the gateway model.
- Do not return secret material to the frontend.
- Do not weaken token expiry, issuer, audience or signature validation without explicit approval.
- Do not reuse API service Prisma clients or generated output from another service.
