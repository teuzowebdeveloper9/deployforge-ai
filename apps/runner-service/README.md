# Runner Service

Go service that executes DeployForge AI quality gates.

## Responsibilities

- Receive a quality-gate job over HTTP.
- Validate the source archive path is inside `STORAGE_ROOT`.
- Extract `source.tar.gz` into a temporary workspace.
- Block archived `.env*` files and path traversal.
- Detect JS/TS, Python and Go projects.
- Run quality commands with timeouts.
- Redact obvious secrets from logs.
- Return a `quality-report.json` shaped response to the API.

## Commands

```bash
go test ./...
go vet ./...
go build ./cmd/runner
```
