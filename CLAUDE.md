# CLAUDE.md

This file gives AI agents concise operating guidance for DeployForge AI.

## Current Phase

Build the base platform only. Do not implement a project skills system, do not add a `.skills` directory and do not create `/skills` routes, modules, tables or workflows.

## Monorepo Responsibilities

- `apps/web`: Next.js dashboard, app management, versions, builds, agent prompts and env metadata UI.
- `apps/api`: NestJS Core API with Prisma/PostgreSQL, orchestration, storage, queue, secrets, auth and Azure-ready ports.
- `apps/agent-service`: FastAPI service using Mistral for safe planning and analysis. It never edits files directly.
- `apps/runner-service`: Go service that executes quality gates in a temporary workspace with timeouts and safe logs.
- `packages/shared-contracts`: event and DTO contracts only.
- `packages/shared-config`: stable configuration helpers only.
- `infra`: Docker, Azure plans, scripts and future IaC.
- `docs`: architecture, services, envs, agents, quality and Azure infrastructure.

## Architecture Rules

- Keep controllers and routes thin.
- Keep business behavior in application use cases/services.
- Keep persistence in infrastructure adapters.
- Keep external systems behind explicit ports/providers.
- Keep shared packages free of business logic.
- Do not allow the API to execute user code directly.
- Runner quality execution must be isolated and timeout-bound.
- Save large runner logs/reports in storage; save summary status in PostgreSQL.

## Secret Rules

- Never create or edit `.env`, `.env.local`, `.env.production`, `.env.test` or any real `.env.*` file.
- Only edit `.env.example`.
- Never return real secret values to the frontend.
- Never save real secret values in the database.
- Never log secret values.
- Use `secret_reference` metadata for Key Vault or local references.

## Azure Direction

Future deployment targets Azure Container Apps for long-running services and Azure Container Apps Jobs for quality gates. Planned managed services are Azure Database for PostgreSQL Flexible Server, Blob Storage, Service Bus, Key Vault, Container Registry, Application Insights, Azure Monitor and Log Analytics. Use Managed Identity and least-privilege RBAC.

## Definition Of Done

- Code is in the correct service and layer.
- No real env file was created or edited.
- No secret was exposed.
- Quality checks pass or failures are reported honestly.
- Documentation and contracts are updated when architecture changes.
- No skills implementation was added in this phase.
