# Local Architecture

DeployForge AI uses Docker Compose as the MVP compute layer. Services stay separated so the same boundaries can move to another orchestrator later.

## Responsibilities

- `postgres`: stores platform metadata.
- `redis`: supports BullMQ events and jobs.
- `minio`: object storage target for source snapshots and build artifacts.
- `registry`: local Docker image registry.
- `web`: Next.js frontend.
- `api`: NestJS orchestration API.
- `agent-service`: FastAPI Mistral planning service.
- `runner-service`: Go quality gate worker.
- `prometheus`: metrics collection base.
- `loki`: log storage base.
- `grafana`: local dashboards.

## Deploy Flow

1. Build service images with Docker.
2. Optionally tag and push images to `localhost:5000`.
3. Start the stack with `docker compose up --build`.
4. Use GitHub Actions as the default CI quality gate.

## Secrets

Do not commit real env files or secrets. Use `.env.example` only. Runtime secrets should be injected by the operator and later resolved from Vault or encrypted with SOPS/Sealed Secrets.

## Sandboxes

Quality gates run through `runner-service` in the MVP. Preview sandboxes should use isolated containers or Docker-in-Docker only after explicit network, filesystem, timeout and log-redaction controls exist.
