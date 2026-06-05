# Services

## Web

Next.js App Router frontend. The first screen is a prompt-first app builder: the user describes an app, sees generation progress, generated files, quality status and a preview. Workspace screens still provide app details, versions, builds, agent messages and optional env metadata.

## Gateway

NGINX reverse proxy and public API gateway. It serves the web app and routes `/auth/*`, `/api/*`, `/ai/*` and `/containers/*` to private upstream services. Protected routes use auth-service verification through `auth_request`, then NGINX forwards trusted user context headers.

## Auth Service

NestJS service that owns registration, login, short-lived access tokens, refresh token hashing and rotation, logout, user identity, organization membership, role and plan context.

## Core API

NestJS API with domain modules and lightweight hexagonal boundaries:

```txt
domain/
application/
infrastructure/
presentation/
```

It owns metadata persistence and orchestrates storage, queue, secrets, agent-service and runner-service. In the gateway profile, the API receives authenticated user context through trusted gateway headers and still enforces ownership and fine-grained authorization in use cases.

Generation uses `POST /apps/generate`. The API calls agent-service for a plan, creates the app metadata, writes generated starter files into a source snapshot, stores preview HTML and requests a quality gate. The API still does not execute user code directly.

## Agent Service

FastAPI service. It builds the DeployForge AI system prompt, detects configured AI provider keys, tries providers in priority order and returns structured planning, analysis or generated app files. The default remote order is Anthropic, Gemini, OpenAI, OpenRouter, DeepSeek and Mistral. Gemini also has an internal model fallback from the configured Pro model to Flash models when quota or model access fails. `GET /agent/providers` returns configured provider status without secret values. `POST /agent/generate-app` returns `app_name`, `description`, `notes` and a bounded `files[]` payload used by the API snapshot flow. If no provider key is configured or every provider fails, it returns a deterministic local fallback so the MVP still runs. Agent routes require the gateway service token when configured.

## Runner Service

Go service. It receives quality gate jobs, extracts a snapshot into a temporary workspace, detects stack type, runs quality commands with timeouts, redacts obvious secrets from logs and returns a quality report. Quality execution requires the gateway service token when configured.
