# DeployForge AI

DeployForge AI is an AI-first platform for creating, versioning, analyzing, previewing and governing applications and microservices.

This MVP provides a local monorepo with a Next.js frontend, NestJS Core API, FastAPI agent-service, Go runner-service, PostgreSQL, Redis/BullMQ-ready queue abstractions, local storage and Azure-ready infrastructure documentation.

The project intentionally does not implement a skills system in this phase.

## Architecture

```txt
apps/web            Next.js App Router dashboard
apps/api            NestJS API, Prisma, PostgreSQL and orchestration
apps/agent-service  FastAPI + Mistral planning/analyze service
apps/runner-service Go quality-gate runner
packages/           Shared contracts and stable config helpers
infra/              Docker, scripts and Azure planning
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

Docker Compose starts PostgreSQL, Redis, API, web, agent-service and runner-service. The API runs Prisma migrations on startup.

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

## Azure Plan

The planned Azure deployment uses:

- Azure Container Apps for web, API, agent-service and runner-service.
- Azure Container Apps Jobs for asynchronous quality gates.
- Azure Blob Storage for snapshots, manifests, checksums, logs and reports.
- Azure Service Bus for domain events.
- Azure Key Vault for secret values.
- Azure Database for PostgreSQL Flexible Server for metadata.
- Azure Container Registry for service images.
- Azure Application Insights, Azure Monitor and Log Analytics for observability.
- Microsoft Entra External ID for future auth.

See `docs/azure-infra.md` and `infra/azure/architecture.md`.

## Env And Secrets

Never create real `.env` files. Use only `.env.example` files and environment variables injected by Docker Compose or the target platform.

The application never stores real secret values in PostgreSQL. It stores metadata and a `secret_reference` that can point to local development storage or Azure Key Vault.

## Quality Protection

The GitHub Actions workflow validates frontend, API, agent-service, runner-service, Docker builds where practical, absence of real env files and a basic secret scan.

CI/CD is a quality guardrail, not the product focus.

## Next Steps

- Add real auth with Microsoft Entra External ID.
- Replace local adapters with Azure Blob Storage, Service Bus and Key Vault implementations.
- Move quality gates to Azure Container Apps Jobs.
- Add preview sandboxes with Azure Container Apps Dynamic Sessions.
- Add richer OpenAPI/AsyncAPI contracts.
- Implement a skills system only in a later phase.
