# Architecture

DeployForge AI uses a pragmatic microservices monorepo. Each deployable service has a narrow responsibility and exposes health/readiness endpoints.

## Services

- `web`: prompt-first builder plus workspace screens for apps, versions, builds, agent prompts and env metadata.
- `api`: generation/orchestration boundary and source of truth for metadata.
- `agent-service`: prioritized AI provider router for planning, analysis and bounded app generation.
- `runner-service`: isolated quality gate executor.

## Core Flow

1. A user writes an app prompt in `web`.
2. `web` calls `POST /apps/generate` in `api`.
3. `api` asks `agent-service` to generate a bounded file set through the best configured AI provider and creates app metadata in PostgreSQL.
4. `api` validates generated paths/content, saves a source snapshot through `StoragePort` and emits domain events through `QueuePort`.
5. `api` asks `runner-service` to run the quality gate for the snapshot and stores logs/reports in storage.
6. `web` shows the generation timeline, generated file list, quality status and preview HTML.
7. Existing workspace screens can still create additional snapshots, run builds and send follow-up agent prompts.

## Boundaries

The API never executes user code. Runner-service owns quality execution. Agent-service never edits files directly. Shared packages contain contracts only.

## Ports And Adapters

- `StoragePort`: local filesystem now, MinIO object storage next.
- `QueuePort`: BullMQ/Redis now, RabbitMQ or NATS later if needed.
- `SecretsPort`: local references now, Vault or SOPS/Sealed Secrets later.
- `AuthProvider`: dev auth now, JWT or a self-hosted identity provider later.

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
