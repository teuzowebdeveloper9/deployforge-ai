# DeployForge AI

DeployForge AI is an AI-first platform for creating, versioning, analyzing, previewing and governing applications and microservices.

This MVP provides a local/open-source monorepo with a Next.js frontend, NestJS Core API, FastAPI agent-service, Go runner-service, PostgreSQL, Redis/BullMQ, local filesystem storage, MinIO-ready storage, local Docker Registry and Grafana/Loki/Prometheus observability.

The project intentionally does not implement a skills system in this phase.

## Architecture

```txt
apps/web            Next.js App Router dashboard
apps/api            NestJS API, Prisma, PostgreSQL and orchestration
apps/agent-service  FastAPI + Mistral planning/analyze service
apps/runner-service Go quality-gate runner
packages/           Shared contracts and stable config helpers
infra/              Docker, local infrastructure docs and scripts
docs/               Architecture and operating docs
```

The API is the source of truth for metadata. It stores apps, versions, builds, env metadata and audit logs in PostgreSQL. It saves source snapshots and large quality logs/reports in storage. It calls agent-service for Mistral-backed planning and runner-service for quality gates.

## Run Locally

```bash
cd deployforge-ai
docker compose up --build
```

Then open:

- Web: `http://localhost:3000`
- API: `http://localhost:3001/health`
- Agent Service: `http://localhost:8001/health`
- Runner Service: `http://localhost:8082/health`
- PostgreSQL: `localhost:15432`
- MinIO Console: `http://localhost:9001`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3002`

Docker Compose starts PostgreSQL, Redis, MinIO, a local Docker Registry, API, web, agent-service, runner-service, Prometheus, Loki and Grafana. The API runs Prisma migrations on startup.

## MVP Flow

1. Open the web dashboard.
2. Create an application.
3. Open the application detail page.
4. Create a fake/local version snapshot.
5. View versions.
6. Start a quality gate from the builds page.
7. Send a prompt on the agent page.
8. Review env variable metadata without seeing secret values.

## Useful API Calls

```bash
curl -X POST http://localhost:3001/apps \
  -H "Content-Type: application/json" \
  -d '{"name":"demo-app","description":"Local MVP app"}'

curl http://localhost:3001/apps

curl -X POST http://localhost:3001/apps/<appId>/versions \
  -H "Content-Type: application/json" \
  -d '{"createdBy":"dev-user"}'

curl -X POST http://localhost:3001/apps/<appId>/versions/<versionId>/quality-gate

curl -X POST http://localhost:3001/apps/<appId>/agent/messages \
  -H "Content-Type: application/json" \
  -d '{"message":"Planeje uma API para billing multi-tenant"}'
```

## Service Commands

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

## Local/Open-Source Infrastructure Plan

DeployForge AI now targets this local-first stack:

- Database: `postgres:alpine`, exposed on `localhost:15432` to avoid clashing with an existing local PostgreSQL.
- Object storage: MinIO.
- Events/jobs: Redis/BullMQ in the MVP; RabbitMQ or NATS can be added later.
- Secrets: local metadata references now; Vault or SOPS/Sealed Secrets later.
- Registry: local Docker Registry on `localhost:5000`.
- Compute: Docker Compose in the MVP.
- Async jobs: `runner-service` / worker container.
- Preview sandbox: Docker-in-Docker or isolated containers later.
- Observability: Grafana, Loki and Prometheus.
- CI/CD: GitHub Actions now; Drone CI or Gitea Actions later.
- Boards/issues: GitHub Issues, Gitea Issues or Plane.
- Git hosting: GitHub now; Gitea local later.

See `docs/local-infra.md` and `infra/local/architecture.md`.

## Env And Secrets

Never create real `.env` files in the repository. Use only `.env.example` files and environment variables injected by Docker Compose or your runtime.

The application never stores real secret values in PostgreSQL. It stores metadata and a `secret_reference` that can point to local references now and Vault/SOPS-managed secrets later.

Exact local env paths and models are documented in `docs/local-env-files.md`.

## Quality Protection

The GitHub Actions workflow validates frontend, API, agent-service, runner-service, Docker builds where practical, absence of real env files and a basic secret scan.

CI/CD is a quality guardrail, not the product focus.

## Next Steps

- Add real auth with JWT first, then a self-hosted identity option if needed.
- Implement the MinIO storage adapter and runner artifact download flow.
- Keep Redis/BullMQ for MVP jobs; add RabbitMQ or NATS only when routing needs justify it.
- Add Vault or SOPS/Sealed Secrets for real secret retrieval.
- Add isolated preview sandboxes with Docker-in-Docker or dedicated containers.
- Add richer OpenAPI/AsyncAPI contracts.
- Implement a skills system only in a later phase.
