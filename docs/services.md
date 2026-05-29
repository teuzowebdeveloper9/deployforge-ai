# Services

## Web

Next.js App Router frontend. The first screen is a prompt-first app builder: the user describes an app, sees generation progress, generated files, quality status and a preview. Workspace screens still provide app details, versions, builds, agent messages and optional env metadata.

## Core API

NestJS API with domain modules and lightweight hexagonal boundaries:

```txt
domain/
application/
infrastructure/
presentation/
```

It owns metadata persistence and orchestrates storage, queue, secrets, agent-service and runner-service.

Generation uses `POST /apps/generate`. The API calls agent-service for a plan, creates the app metadata, writes generated starter files into a source snapshot, stores preview HTML and requests a quality gate. The API still does not execute user code directly.

## Agent Service

FastAPI service. It builds the DeployForge AI system prompt, calls Mistral and returns structured planning, analysis or generated app files. `POST /agent/generate-app` returns `app_name`, `description`, `notes` and a bounded `files[]` payload used by the API snapshot flow. If `MISTRAL_API_KEY` is missing or `replace_me`, it returns a deterministic local fallback so the MVP still runs.

## Runner Service

Go service. It receives quality gate jobs, extracts a snapshot into a temporary workspace, detects stack type, runs quality commands with timeouts, redacts obvious secrets from logs and returns a quality report.
