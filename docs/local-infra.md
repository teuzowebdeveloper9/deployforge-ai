# Local/Open-Source Infrastructure

DeployForge AI is now planned around a local/open-source infrastructure profile first. The MVP runs on Docker Compose and keeps provider ports in the API so the platform can evolve without leaking infrastructure details into business code.

## Resource Map

| Capability | MVP / Planned Local Stack |
| --- | --- |
| Database | `postgres:alpine` |
| Object storage | MinIO |
| Events and jobs | Redis/BullMQ now; RabbitMQ or NATS can be added later |
| Secrets | Local secret references now; Vault or SOPS/Sealed Secrets later |
| Registry | Local Docker Registry |
| Compute | Docker Compose |
| Async jobs | Worker container / `runner-service` |
| Preview sandbox | Docker-in-Docker or isolated containers later |
| Observability | Grafana, Loki and Prometheus |
| CI/CD | GitHub Actions now; Drone CI or Gitea Actions later |
| Work tracking | GitHub Issues, Gitea Issues or Plane |
| Git hosting | GitHub now; Gitea local later |

## Runtime Flow

1. `web` calls `api`.
2. `api` stores metadata in PostgreSQL.
3. `api` publishes MVP events through Redis/BullMQ.
4. Snapshots and reports use filesystem storage now, with MinIO as the object-storage target.
5. `runner-service` executes quality gates as a separate container.
6. `agent-service` calls Mistral and returns plans or analysis without editing files.
7. Grafana, Loki and Prometheus are available as the local observability base.

## Secrets Flow

The database stores only `secret_reference` metadata. Real secret values must stay outside the database and source control.

MVP references use `local://...`. The planned self-hosted model is:

- Vault for runtime secret retrieval.
- SOPS or Sealed Secrets for encrypted GitOps-style config later.
- No hardcoded registry, storage, queue or provider credentials.

## Storage Flow

Current API flow uses local filesystem storage because the runner reads local paths during quality gates. MinIO is included in Compose and documented as the object-storage target. The MinIO adapter exists as a planned infrastructure adapter; switching to it also requires runner download/extract support instead of direct local paths.

## Events Flow

Redis/BullMQ remains the MVP queue. NATS or RabbitMQ can be introduced through `QueuePort` when event volume or routing needs justify it.

## Observability Flow

Services emit structured logs to stdout today. Grafana, Loki and Prometheus are included for the local observability profile. Full metrics endpoints and log shipping can be added incrementally without changing service boundaries.

## Preview/Sandbox Evolution

Preview execution is not implemented in this MVP. The local path is isolated containers, Docker-in-Docker or a dedicated sandbox worker with strict timeouts, network controls, workspace boundaries and log redaction.
