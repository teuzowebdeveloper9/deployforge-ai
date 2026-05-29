# Core API

NestJS orchestration API for DeployForge AI.

## Responsibilities

- Own app, version, build, env metadata, agent message and audit metadata.
- Persist metadata through Prisma/PostgreSQL.
- Save snapshots, manifests, checksums, logs and reports through `StoragePort`.
- Publish events through `QueuePort`.
- Store secret references only through `SecretsPort`.
- Call agent-service and runner-service.

The API must never execute user code directly.

## Commands

```bash
npm install
npx prisma generate
npm run lint
npm run typecheck
npm test
npm run build
```
