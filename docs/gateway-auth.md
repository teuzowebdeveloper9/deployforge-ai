# Gateway And Auth Layer

DeployForge AI uses a public NGINX gateway and a private NestJS auth-service.

## Public Boundary

Only `gateway` publishes a host port in `docker-compose.yml`.

```txt
Browser
  -> gateway:8080
     -> /auth/*       auth-service
     -> /api/*        Core API
     -> /ai/*         agent-service
     -> /containers/* runner/container service
     -> /             web
```

All upstream services are attached to the private `backend` Docker network and use `expose`, not host `ports`.

## Authentication Flow

1. Public auth routes go to `auth-service`.
2. Protected routes use NGINX `auth_request` against `GET /internal/verify`.
3. `auth-service` validates the access token and returns trusted context headers.
4. NGINX overwrites client-supplied auth context headers before proxying.
5. Upstream services accept context only when `X-Gateway-Token` matches `GATEWAY_SERVICE_TOKEN`.

Trusted context headers:

```txt
X-User-Id
X-User-Email
X-User-Name
X-Org-Id
X-Role
X-Plan
X-Session-Id
X-Gateway-Token
```

## Token Model

- Access token: short-lived HS256 JWT with issuer, audience, subject, org, role, plan and session id.
- Refresh token: opaque random token stored only as an HMAC hash.
- Refresh rotation: every refresh revokes the previous session row and creates a new one in the same family.
- Refresh token reuse: reuse of a revoked token revokes the whole token family.

## Rate Limits

The gateway applies separate limits for:

- `/auth/login`, `/auth/register`, `/auth/refresh`
- `/ai/*`
- `/containers/*`

## Security Tests

Run these before exposing a deployment:

- Call `/api/*`, `/ai/*`, `/containers/*` without bearer token and expect `401`.
- Send fake `X-User-Id`, `X-Org-Id`, `X-Role`, `X-Plan` from the client and verify upstream receives only gateway-derived values.
- Reuse an old refresh token after rotation and verify the family is revoked.
- Verify direct host access to API, auth-service, agent-service and runner-service is unavailable.
- Confirm API, Agent and Runner reject requests with missing or wrong `X-Gateway-Token`.
- Confirm logs do not contain bearer tokens, refresh tokens, passwords, prompts with secrets or provider keys.
