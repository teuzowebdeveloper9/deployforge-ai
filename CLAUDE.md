# CLAUDE.md

This file gives AI agents concise operating guidance for DeployForge AI.

## Current Phase

Build the base platform only. Do not implement a project skills system, do not add a `.skills` directory and do not create `/skills` routes, modules, tables or workflows.

## Monorepo Responsibilities

- `apps/web`: Next.js prompt-first builder plus app workspace, versions, builds, agent prompts and env metadata UI.
- `apps/api`: NestJS Core API with Prisma/PostgreSQL, app generation, orchestration, storage, queue, secrets, auth and local/open-source-ready ports.
- `apps/agent-service`: FastAPI service using Mistral for safe planning, analysis and bounded generated app file payloads. It never edits files directly.
- `apps/runner-service`: Go service that executes quality gates in a temporary workspace with timeouts and safe logs.
- `packages/shared-contracts`: event and DTO contracts only.
- `packages/shared-config`: stable configuration helpers only.
- `infra`: Docker, local infrastructure plans and scripts.
- `docs`: architecture, services, envs, agents, quality and local infrastructure.

## Architecture Rules

- Keep controllers and routes thin.
- Keep business behavior in application use cases/services.
- Keep persistence in infrastructure adapters.
- Keep external systems behind explicit ports/providers.
- Keep shared packages free of business logic.
- Do not allow the API to execute user code directly.
- Keep app generation in application use cases; controllers only receive requests and return responses.
- Validate agent-generated file paths and content before writing snapshots.
- Runner quality execution must be isolated and timeout-bound.
- Save large runner logs/reports in storage; save summary status in PostgreSQL.

## Secret Rules

- Never create or edit `.env`, `.env.local`, `.env.production`, `.env.test` or any real `.env.*` file.
- Only edit `.env.example`.
- Never return real secret values to the frontend.
- Never save real secret values in the database.
- Never log secret values.
- Use `secret_reference` metadata for local, Vault, SOPS or Sealed Secrets references.

## Local/Open-Source Direction

The MVP targets Docker Compose with `postgres:alpine`, Redis/BullMQ, MinIO, a local Docker Registry, Grafana, Loki and Prometheus. Planned evolutions are RabbitMQ or NATS for events, Vault or SOPS/Sealed Secrets for secret management, Docker-in-Docker or isolated containers for preview sandboxes, and Drone CI or Gitea Actions if a local CI provider is needed.

## Definition Of Done

- Code is in the correct service and layer.
- No real env file was created or edited.
- No secret was exposed.
- Quality checks pass or failures are reported honestly.
- Documentation and contracts are updated when architecture changes.
- No skills implementation was added in this phase.
