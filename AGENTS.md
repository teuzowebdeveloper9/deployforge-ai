# AGENTS.md

Project laws for AI coding agents working on DeployForge AI.

## Architecture

DeployForge AI is a monorepo for an AI-first platform that creates, versions, analyzes, previews and governs applications and microservices.

```txt
apps/web              Next.js user interface
apps/api              NestJS orchestration API and source of truth
apps/agent-service    FastAPI service that talks to Mistral
apps/runner-service   Go service for isolated quality gates
packages/shared-*     Contracts and stable shared configuration only
infra/                Docker, Azure planning and operational scripts
docs/                 Architecture and operating documentation
```

The system is intentionally prepared for Azure Container Apps, Azure Service Bus, Azure Blob Storage, Azure Key Vault, Azure Database for PostgreSQL Flexible Server, Azure Container Registry, Azure Application Insights, Azure Monitor and Log Analytics.

No `.skills` directory or skills runtime belongs in this phase.

## Service Boundaries

- Web renders dashboards and sends user actions to the API.
- API owns users, apps, versions, builds, env metadata, audit logs and orchestration.
- Agent Service receives prompts, builds a safe system prompt and returns structured Mistral-backed analysis. It never edits files.
- Runner Service receives quality gate jobs, runs checks inside a temporary workspace and returns logs/report data.
- Shared packages hold contracts, schemas and stable helpers only. They must not contain product business rules.

## Layering Rules

- Controllers, routers and handlers translate transport concerns only.
- Business orchestration lives in application use cases or services.
- Domain entities stay framework-light.
- Database access is limited to infrastructure persistence adapters.
- External providers live behind explicit ports or provider classes.
- The API must never execute user code directly; quality execution belongs to runner-service.

## Env And Secrets

- Never edit or create real `.env` files.
- Only create or update `.env.example`, README or `docs/envs.md`.
- Never commit secrets.
- Never save real secret values in PostgreSQL.
- Never log secrets, tokens, API keys, passwords, authorization headers or sensitive payloads.
- Env metadata may store `key`, `environment`, `secret_reference`, `is_required` and timestamps only.
- Azure credentials must use Managed Identity and RBAC in future deployments, not hardcoded credentials.

## Quality Rules

- Never remove tests to make the pipeline pass.
- Never remove lint or typecheck to hide errors.
- Never bypass quality gates for user-code execution.
- Keep logs useful, structured and safe.
- Use focused tests for critical behavior.
- Keep CI/CD as a protection layer, not the product focus.

## Creating A Module

1. Confirm the owning service and bounded context.
2. Add DTO/schema validation at the transport boundary.
3. Put orchestration in a use case or service.
4. Keep data access in repository or persistence adapters.
5. Add tests for rules or orchestration with meaningful risk.
6. Update docs and contracts when behavior crosses service boundaries.

## Creating A Microservice

1. Confirm the service has a clear responsibility.
2. Define inbound APIs, outbound calls, owned data and events.
3. Add README, `.env.example`, Dockerfile, health and readiness endpoints.
4. Add quality commands and CI coverage.
5. Update `docs/services.md`, `docs/architecture.md`, `AGENTS.md` and `CLAUDE.md`.

## Prohibited Actions

- Never edit real `.env` files.
- Never commit secrets.
- Never remove tests to make pipeline pass.
- Never remove lint/typecheck to hide errors.
- Never change architecture without explicit request.
- Never put business logic in controller/router/handler code.
- Never access the database outside the allowed layer.
- Never create circular dependencies.
- Never create a microservice without clear responsibility.
- Never create shared packages with business rules.
- Never use hardcoded Azure credentials.
- Do not implement the skills system in this phase.
- Always update documentation if architecture changes.

## Useful Commands

```bash
docker compose up --build
npm run check:no-env
npm run secret-scan
```

Service-specific commands are documented in each service README.
