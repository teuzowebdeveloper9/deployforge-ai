# Azure Architecture

## Resources

- Resource Group: logical boundary for DeployForge AI resources.
- Azure Container Apps Environment: hosts web, API, agent-service and runner-service.
- Azure Container Apps Jobs: runs asynchronous quality gates.
- Azure Container Registry: stores service images.
- Azure Database for PostgreSQL Flexible Server: stores platform metadata.
- Azure Blob Storage: stores snapshots, manifests, checksums, build logs and reports.
- Azure Service Bus: transports domain events.
- Azure Key Vault: stores secret values.
- Application Insights, Azure Monitor and Log Analytics: observability.
- Managed Identities: service authentication to Azure resources.

## Deploy Flow

1. CI builds each service image.
2. CI pushes images to ACR.
3. Infrastructure deploy updates Container Apps revisions.
4. API migrations run through a controlled deployment job.

## Secret Flow

Secret values are written to Azure Key Vault outside application code. PostgreSQL stores only `secret_reference`. Services resolve values using Managed Identity and least-privilege RBAC.

## Event Flow

The API publishes domain events through `QueuePort`. Local MVP uses Redis/BullMQ. Cloud uses Azure Service Bus topics/queues.

## Storage Flow

The API writes source snapshots, manifests, checksums, logs and reports through `StoragePort`. Local MVP uses filesystem storage. Cloud uses Azure Blob Storage.

## Observability Flow

Each service emits structured logs with request/correlation IDs. Azure Monitor and Log Analytics centralize logs. Application Insights receives traces and request telemetry.

## Preview Evolution

Preview and sandbox sessions are documented for Azure Container Apps Dynamic Sessions. They are not implemented in this MVP. The intended model is temporary, isolated sessions with strict network, timeout and identity boundaries.
