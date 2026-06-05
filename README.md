# DeployForge AI

DeployForge AI is an AI-first builder workspace for creating, evolving, versioning, validating and previewing applications and microservices.

The product experience is intentionally closer to Lovable, v0, Replit Agent and Cursor than a CRUD dashboard: the user starts with a prompt, enters a project workspace, keeps chatting in the same app context, follows structured agent activity and inspects the live preview beside the conversation.

This phase does not implement a skills system. Skills are a future evolution and must not be added in this MVP.

## What Is Included

- Next.js frontend with Tailwind-first styling, an AI-first prompt home, animated drawer sidebar, project chat, agent activity timeline and expandable preview panel.
- NGINX API Gateway with auth-request enforcement and private Docker networking for upstream services.
- NestJS Auth Service for registration, login, access tokens, refresh token rotation, logout and gateway verification.
- NestJS Core API with Prisma/PostgreSQL, modular domains and orchestration endpoints.
- FastAPI agent-service with prioritized AI provider routing for planning, analysis and generated app file sets.
- Go runner-service for quality gates and report generation.
- PostgreSQL, Redis/BullMQ, MinIO-ready storage, local Docker Registry, Prometheus, Loki and Grafana through Docker Compose.
- GitHub Actions CI with frontend, API, agent-service, runner-service, Docker and safety checks.
- Documentation for architecture, services, envs, quality, agents and local/open-source infrastructure.

## Monorepo Layout

```txt
apps/
  web/             Next.js App Router frontend
  auth-service/    NestJS authentication and gateway verification
  api/             NestJS Core API, Prisma and orchestration
  agent-service/   FastAPI service backed by prioritized AI providers
  runner-service/  Go quality-gate runner
packages/
  shared-contracts/
  shared-config/
infra/
  docker/          Docker and observability helpers
  local/           Local-first infra notes
  scripts/         Safety checks
docs/              Architecture and operating docs
```

## Product Flow

1. Open `http://localhost:8080`.
2. Describe the app you want in the large prompt input.
3. The frontend creates a project draft and immediately navigates to `/apps/{appId}/agent`.
4. The first prompt is sent inside the project workspace.
5. The chat keeps app context between messages.
6. Agent activity appears as structured steps inside the conversation.
7. The preview panel stays visible from the start and can be expanded.
8. When generated preview artifacts exist, `Open` opens the app preview.
9. Follow-up prompts continue the same project instead of creating a new app.

## Architecture

```txt
web
  -> gateway
     -> auth-service for identity and gateway verification
     -> api
        -> postgres for metadata
        -> storage for snapshots, logs, reports and preview artifacts
        -> redis/bullmq for local events/jobs
        -> agent-service for AI planning/generation
        -> runner-service for quality gates
```

The API is the source of truth for metadata. It does not execute user code directly. It coordinates app creation, version snapshots, agent messages, quality gates and preview artifacts.

The runner-service is isolated from the API and is responsible for executing quality commands with timeouts and log capture.

The agent-service does not edit repository files directly. It plans, analyzes and returns structured responses or generated file payloads that the API validates before storing.

## Run Locally

```bash
cd deployforge-ai
docker compose up --build
```

Then open:

| Service | URL |
| --- | --- |
| Public Gateway and Web | `http://localhost:8080` |
| Gateway health | `http://localhost:8080/gateway/health` |

Docker Compose starts PostgreSQL, Redis, MinIO, local Docker Registry, gateway, auth-service, API, web, agent-service, runner-service, Prometheus, Loki and Grafana. Only the gateway publishes a host port. The API and auth-service apply Prisma migrations on startup.

## Environment Files

Do not create or commit real `.env` files.

Only use these templates as references:

```txt
apps/web/.env.example
apps/auth-service/.env.example
apps/api/.env.example
apps/agent-service/.env.example
apps/runner-service/.env.example
```

The agent-service detects configured AI provider keys and tries them in priority order. The default order favors current coding-heavy community/frontier choices and keeps Mistral as the last remote fallback:

```txt
apps/agent-service/.env.example
AI_PROVIDER_ORDER="anthropic,gemini,openai,openrouter,deepseek,mistral"
ANTHROPIC_API_KEY="replace_me"
GEMINI_API_KEY="replace_me"
OPENAI_API_KEY="replace_me"
OPENROUTER_API_KEY="replace_me"
DEEPSEEK_API_KEY="replace_me"
MISTRAL_API_KEY="replace_me"
```

For Docker Compose, provide one or more provider keys through your shell or local runtime environment before starting the stack. Never commit real values.
Gemini tries `GEMINI_MODEL` first and then `GEMINI_FALLBACK_MODELS` so quota failures on Pro models can fall back to Flash.

More detail:

- `docs/gateway-auth.md`
- `docs/ai-provider-routing.md`
- `docs/agent-design-skill.md`
- `docs/envs.md`
- `docs/local-env-files.md`

## Security Rules

- Never create real `.env`, `.env.local`, `.env.production` or `.env.*` files in the repository.
- Never commit secrets.
- Never store secret values in PostgreSQL.
- Store only env metadata and `secret_reference`.
- Never log secrets.
- Never hardcode cloud or registry credentials.
- Never remove lint, typecheck or tests just to pass CI.
- Never place business rules in controllers or routers.
- Never add a skills system in this phase.

## API Examples

Create a draft app:

```bash
curl -X POST http://localhost:8080/api/apps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"name":"demo-app","description":"Local MVP app"}'
```

List apps:

```bash
curl http://localhost:8080/api/apps -H "Authorization: Bearer <accessToken>"
```

Generate a full app with AI-backed files, snapshot, quality gate and preview:

```bash
curl -X POST http://localhost:8080/api/apps/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"prompt":"Create a CRM with customers, pipeline dashboard and notes."}'
```

Continue an existing project chat:

```bash
curl -X POST http://localhost:8080/api/apps/<appId>/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"message":"Improve this app with a billing dashboard and explain the quality gates."}'
```

Read messages and agent steps:

```bash
curl http://localhost:8080/api/apps/<appId>/messages -H "Authorization: Bearer <accessToken>"
curl http://localhost:8080/api/apps/<appId>/steps -H "Authorization: Bearer <accessToken>"
```

Open preview HTML:

```bash
curl http://localhost:8080/api/apps/<appId>/preview -H "Authorization: Bearer <accessToken>"
```

Run quality gate for a version:

```bash
curl -X POST http://localhost:8080/api/apps/<appId>/versions/<versionId>/quality-gate \
  -H "Authorization: Bearer <accessToken>"
```

## Development Commands

Frontend:

```bash
cd apps/web
npm install
npm run lint
npm run typecheck
npm run build
```

API:

```bash
cd apps/api
npm install
npx prisma generate
npm run lint
npm run typecheck
npm test
npm run build
```

Auth Service:

```bash
cd apps/auth-service
npm install
npx prisma generate
npm run lint
npm run typecheck
npm test
npm run build
```

Agent Service:

```bash
cd apps/agent-service
pip install -e ".[dev]"
ruff check .
pytest
```

Runner Service:

```bash
cd apps/runner-service
go test ./...
go vet ./...
go build ./cmd/runner
```

Root safety checks:

```bash
npm run check:no-env
npm run secret-scan
npm run quality
```

## Local Infrastructure Direction

DeployForge AI currently targets a local-first/open-source stack:

| Cloud concern | MVP replacement |
| --- | --- |
| Azure Database for PostgreSQL | `postgres:16-alpine` |
| Azure Blob Storage | MinIO-ready storage/local storage |
| Azure Service Bus | Redis/BullMQ |
| Azure Key Vault | local secret references now, Vault or SOPS later |
| Azure Container Registry | local Docker Registry |
| Azure Container Apps | Docker Compose |
| Azure Container Apps Jobs | runner-service / worker container |
| Dynamic Sessions / sandbox | isolated containers later |
| Application Insights | Grafana, Loki, Prometheus |
| Azure Pipelines | GitHub Actions |

See:

- `docs/local-infra.md`
- `infra/local/architecture.md`
- `infra/docker/README.md`

## Quality Gates

The runner-service is prepared to run stack-aware quality checks:

- JavaScript/TypeScript: install, lint, typecheck, tests and build.
- Python: install requirements, `ruff check .` and `pytest`.
- Go: `go test ./...`, `go vet ./...` and `go build ./...`.

The runner blocks unsafe workspace access patterns, applies timeouts and produces quality reports for API/storage integration.

## CI

GitHub Actions validates:

- Frontend install, lint, typecheck and build.
- API install, lint, typecheck, tests and build.
- Agent-service `ruff check` and `pytest`.
- Runner-service `go test`, `go vet` and `go build`.
- Absence of real env files.
- Basic secret scan.
- Docker builds where practical.

CI/CD is a quality protection layer, not the product focus.

## Documentation

- `docs/architecture.md`
- `docs/services.md`
- `docs/envs.md`
- `docs/local-env-files.md`
- `docs/quality.md`
- `docs/agents.md`
- `docs/local-infra.md`
- `docs/branch-impact-summary.md`
- `AGENTS.md`
- `CLAUDE.md`

## Current Limitations

- The first generated preview is intentionally simple and static.
- Preview sandboxing is documented but not fully implemented.
- Auth is still dev-oriented.
- Redis/BullMQ is the MVP queue.
- Secrets are stored as metadata references only.
- No skills system exists in this phase.

## Next Steps

- Add a real streaming transport for agent status updates.
- Expand preview sandbox isolation.
- Implement MinIO adapter usage end to end for generated artifacts.
- Add richer OpenAPI/AsyncAPI contracts.
- Add JWT auth, then a self-hosted identity option if needed.
- Introduce Vault or SOPS/Sealed Secrets for real secret retrieval.
- Implement skills only in a later, explicitly requested phase.
