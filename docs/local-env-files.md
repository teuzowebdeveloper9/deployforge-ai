# Local Env Files

Nao commite estes arquivos. Crie localmente apenas na sua maquina quando for rodar sem Docker Compose.

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
STORAGE_ROOT="./storage"
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
```

## Docker Compose

Para `docker compose up --build`, voce nao precisa criar `.env.local`; o `docker-compose.yml` ja injeta os valores locais.
