# Auth Service

NestJS authentication service for DeployForge AI.

It owns registration, login, refresh token rotation, logout and gateway token verification. It is intended to run only on the private Docker network behind the NGINX gateway.

## Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /internal/verify`
- `GET /health`
- `GET /ready`

`/internal/verify` is for NGINX `auth_request` only and requires `X-Internal-Auth-Token`.

## Local Commands

```bash
npm install
npx prisma generate
npm run lint
npm run typecheck
npm test
npm run build
```
