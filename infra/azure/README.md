# Azure Deployment Plan

This directory contains the planned Azure infrastructure layout for DeployForge AI.

## Image Names

```txt
deployforge-web
deployforge-api
deployforge-agent-service
deployforge-runner-service
```

## Build And Push

```bash
az acr login --name <acrName>
docker build -f apps/web/Dockerfile -t <acrName>.azurecr.io/deployforge-web:latest .
docker build -f apps/api/Dockerfile -t <acrName>.azurecr.io/deployforge-api:latest .
docker build -f apps/agent-service/Dockerfile -t <acrName>.azurecr.io/deployforge-agent-service:latest .
docker build -f apps/runner-service/Dockerfile -t <acrName>.azurecr.io/deployforge-runner-service:latest .
docker push <acrName>.azurecr.io/deployforge-web:latest
docker push <acrName>.azurecr.io/deployforge-api:latest
docker push <acrName>.azurecr.io/deployforge-agent-service:latest
docker push <acrName>.azurecr.io/deployforge-runner-service:latest
```

Use Managed Identity for runtime access to Blob Storage, Key Vault and Service Bus.
