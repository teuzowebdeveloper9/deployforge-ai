# Services

## Web

Next.js App Router frontend. It provides fake/dev login context, app dashboard, app creation, versions, builds, agent messages and env metadata screens.

## Core API

NestJS API with domain modules and lightweight hexagonal boundaries:

```txt
domain/
application/
infrastructure/
presentation/
```

It owns metadata persistence and orchestrates storage, queue, secrets, agent-service and runner-service.

## Agent Service

FastAPI service. It builds the DeployForge AI system prompt, calls Mistral and returns structured planning or analysis output. If `MISTRAL_API_KEY` is missing or `replace_me`, it returns a deterministic local fallback so the MVP still runs.

## Runner Service

Go service. It receives quality gate jobs, extracts a snapshot into a temporary workspace, detects stack type, runs quality commands with timeouts, redacts obvious secrets from logs and returns a quality report.
