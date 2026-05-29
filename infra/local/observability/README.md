# Local Observability

The Compose profile includes Prometheus, Loki and Grafana as the local observability baseline.

Current services expose health/readiness endpoints and structured logs. Next increments:

- Add service metrics endpoints.
- Add correlation/request IDs across service calls.
- Add Loki log shipping through a collector.
- Add Grafana dashboards for API latency, quality gate status and agent-service errors.
