# Architecture

DeployForge AI uses a pragmatic microservices monorepo. Each deployable service has a narrow responsibility and exposes health/readiness endpoints.

## Services

- `web`: prompt-first builder plus workspace screens for apps, versions, builds, agent prompts and env metadata.
- `gateway`: public NGINX reverse proxy for `/auth`, `/api`, `/ai`, `/containers` and web traffic.
- `auth-service`: NestJS authentication boundary with access tokens, refresh rotation and organization context.
- `api`: generation/orchestration boundary and source of truth for metadata.
- `agent-service`: prioritized AI provider router for planning, analysis and bounded app generation.
- `runner-service`: isolated quality/CI executor.

## Core Flow

1. A user authenticates through `gateway -> auth-service`.
2. A user writes an app prompt in `web`.
3. `web` calls `gateway -> /api/*`.
4. `gateway` verifies the access token through `auth-service` and forwards trusted user/org context.
5. `api` asks `agent-service` to generate a bounded file set through the best configured AI provider and creates app metadata in PostgreSQL.
6. `api` validates generated paths/content, saves a source snapshot through `StoragePort` and emits domain events through `QueuePort`.
7. `api` asks `runner-service` to run CI checks for the snapshot and stores logs/reports in storage.
8. `web` shows the generation timeline, generated file list, CI/CD status and preview HTML.
9. A user can run `POST /apps/:appId/ci-cd`; failed runs can trigger one AI repair version through the same snapshot and runner flow.
10. Existing workspace screens can still create additional snapshots, run builds and send follow-up agent prompts.

## Boundaries

The API never executes user code. Runner-service owns quality execution. Agent-service never edits files directly. Shared packages contain contracts only.

The gateway performs coarse authentication only. Service-level authorization remains in API, agent-service and runner/container-service.

## Ports And Adapters

- `StoragePort`: local filesystem now, MinIO object storage next.
- `QueuePort`: BullMQ/Redis now, RabbitMQ or NATS later if needed.
- `SecretsPort`: local references now, Vault or SOPS/Sealed Secrets later.
- `AuthProvider`: gateway auth now, dev auth for local direct service development.

## Data

PostgreSQL stores metadata for users, apps, versions, builds, build logs, agent messages, agent runs, env variables and audit logs.

Large files belong in storage:

```txt
users/{userId}/apps/{appId}/versions/{versionId}/source.tar.gz
users/{userId}/apps/{appId}/versions/{versionId}/manifest.json
users/{userId}/apps/{appId}/versions/{versionId}/checksum.sha256
users/{userId}/apps/{appId}/builds/{buildId}/logs.txt
users/{userId}/apps/{appId}/builds/{buildId}/quality-report.json
users/{userId}/apps/{appId}/preview/index.html
```

## Security

Secrets are never stored as values in PostgreSQL and never returned to the frontend. Runtime credentials for storage, queues, registry and secret providers must be injected outside source control. Future secret management should use Vault or encrypted config with SOPS/Sealed Secrets.
