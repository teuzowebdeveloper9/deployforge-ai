# Local Env File Models

Nao commite estes arquivos. Esta pagina mostra os paths e modelos para voce usar localmente quando for rodar sem Docker Compose.

Regra do repositorio: agentes nao devem criar nem editar `.env.local` real. Use os modelos abaixo na sua maquina e mantenha os arquivos fora do Git.

## Web

Path:

```txt
apps/web/.env.local
```

Conteudo:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## Core API

Path:

```txt
apps/api/.env.local
```

Conteudo:

```env
NODE_ENV="development"
PORT="3001"
DATABASE_URL="postgresql://deployforge:deployforge_dev_password@localhost:5432/deployforge?schema=public"
REDIS_URL="redis://localhost:6379"
QUEUE_PROVIDER="bullmq"
STORAGE_PROVIDER="local"
STORAGE_ROOT="./storage"
MINIO_ENDPOINT="http://localhost:9000"
MINIO_BUCKET="deployforge"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
SECRETS_PROVIDER="local"
VAULT_ADDR="http://localhost:8200"
OBSERVABILITY_PROVIDER="stdout"
RUNNER_SERVICE_URL="http://localhost:8082"
AGENT_SERVICE_URL="http://localhost:8001"
AUTH_PROVIDER="dev"
CORS_ORIGIN="http://localhost:3000"
```

## Agent Service

Path:

```txt
apps/agent-service/.env.local
```

Conteudo:

```env
PORT="8001"
MISTRAL_API_KEY="COLOQUE_SUA_CHAVE_MISTRAL_AQUI"
MISTRAL_MODEL="mistral-large-latest"
LOG_LEVEL="INFO"
OBSERVABILITY_PROVIDER="stdout"
```

## Runner Service

Path:

```txt
apps/runner-service/.env.local
```

Conteudo:

```env
PORT="8082"
STORAGE_ROOT="./storage"
QUALITY_TIMEOUT_SECONDS="120"
SANDBOX_PROVIDER="local-workspace"
OBSERVABILITY_PROVIDER="stdout"
```

## Docker Compose

Para `docker compose up --build`, voce nao precisa criar `.env.local`; o `docker-compose.yml` ja injeta os valores locais.

## Servicos Locais De Infra

Esses servicos sobem pelo Compose:

```txt
PostgreSQL: localhost:5432
Redis/BullMQ: localhost:6379
MinIO API: localhost:9000
MinIO Console: localhost:9001
Docker Registry: localhost:5000
Prometheus: localhost:9090
Loki: localhost:3100
Grafana: localhost:3002
```
