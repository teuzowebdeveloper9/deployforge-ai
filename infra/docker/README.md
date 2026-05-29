# Docker

Docker-specific notes and future compose overrides can live here.

The MVP entrypoint is the root `docker-compose.yml`.

## Included Local Services

- PostgreSQL
- Redis/BullMQ
- MinIO
- Local Docker Registry
- Prometheus
- Loki
- Grafana
- Web, API, agent-service and runner-service

Observability config lives in `infra/docker/observability/`.
