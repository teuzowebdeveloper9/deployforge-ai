# Local Infrastructure

This directory documents the local/open-source infrastructure profile for DeployForge AI.

## Components

- PostgreSQL: metadata database.
- Redis/BullMQ: MVP queue and job events.
- MinIO: object storage target for snapshots, manifests, logs and reports.
- Docker Registry: local image registry.
- Grafana, Loki and Prometheus: local observability baseline.
- Vault or SOPS/Sealed Secrets: planned secret management path.

The root `docker-compose.yml` is the MVP entrypoint.

## Useful Endpoints

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- Agent Service: `http://localhost:8001`
- Runner Service: `http://localhost:8082`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`
- Docker Registry: `localhost:5000`
- Prometheus: `http://localhost:9090`
- Loki: `http://localhost:3100`
- Grafana: `http://localhost:3002`
