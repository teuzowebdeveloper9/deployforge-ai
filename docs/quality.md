# Quality

Quality gates protect the architecture and user-generated applications.

## CI Checks

- Web: install, lint, typecheck, build.
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
