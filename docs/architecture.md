# Architecture

DeployForge AI uses a pragmatic microservices monorepo. Each deployable service has a narrow responsibility and exposes health/readiness endpoints.

## Services

- `web`: user interface for apps, versions, builds, agent prompts and env metadata.
- `api`: orchestration boundary and source of truth for metadata.
- `agent-service`: Mistral-backed planning and analysis service.
- `runner-service`: isolated quality gate executor.

## Core Flow

1. A user creates an app in `web`.
2. `web` calls `api`.
3. `api` persists metadata in PostgreSQL and emits domain events through a queue port.
4. A version snapshot is saved through `StoragePort`.
5. Quality gates are requested through `api`, executed by `runner-service` and summarized back in PostgreSQL.
6. Prompts are sent through `api` to `agent-service`, which calls Mistral or returns a safe local fallback.

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
```

## Security

Secrets are never stored as values in PostgreSQL and never returned to the frontend. Runtime credentials for storage, queues, registry and secret providers must be injected outside source control. Future secret management should use Vault or encrypted config with SOPS/Sealed Secrets.
