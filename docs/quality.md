# Quality

Quality gates protect the architecture and user-generated applications.

## CI Checks

- Web: install, lint, typecheck, build.
- Auth Service: install, Prisma generate, lint, typecheck, test, build.
- API: install, Prisma generate, lint, typecheck, test, build.
- Agent Service: ruff check, pytest.
- Runner Service: go test, go vet, go build.
- Repository: no real env files and basic secret scan.

## Runner Checks

Runner-service detects common stacks and runs:

- JS/TS: `npm install`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` when scripts exist.
- Python: `pip install -r requirements.txt`, `ruff check .`, `pytest`.
- Go: `go test ./...`, `go vet ./...`, `go build ./...`.

All commands run with timeouts in a temporary workspace. Logs are redacted for obvious secret patterns.

## App CI/CD

The application exposes `POST /apps/:appId/ci-cd` as the product-level pipeline action. It runs a stored version snapshot through runner-service and stores the result as a build with type `CI_CD`.

When the first CI/CD run fails, the API can make one agent-service repair attempt. That repair goes through the same real flow as a chat update: generated files are validated, a new snapshot is created, runner-service runs quality checks, and the preview is updated only after a generated preview artifact exists.
