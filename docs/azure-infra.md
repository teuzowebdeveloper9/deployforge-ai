# Azure Infrastructure

DeployForge AI is prepared for Azure, while the MVP runs locally with Docker Compose.

## Planned Resources

- Resource Group
- Azure Container Apps Environment
- Azure Container Registry
- Azure Database for PostgreSQL Flexible Server
- Azure Blob Storage Account
- Azure Service Bus Namespace
- Azure Key Vault
- Application Insights
- Log Analytics Workspace
- Managed Identities
- Virtual Network and Private Endpoints where appropriate

## Compute

Long-running services:

- `deployforge-web`
- `deployforge-api`
- `deployforge-agent-service`
- `deployforge-runner-service`

Asynchronous quality gates should move to Azure Container Apps Jobs.

Preview/sandbox execution should evolve to Azure Container Apps Dynamic Sessions for temporary, isolated sessions.

## Identity And Secrets

Services should use Managed Identity and RBAC to access Blob Storage, Key Vault, Service Bus and ACR. No Azure credentials should be stored in source code or service configuration.

## Observability

All services should emit structured logs with request IDs and correlation IDs. Application Insights, Azure Monitor and Log Analytics centralize telemetry.
