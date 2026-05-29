# Local CI/CD Options

GitHub Actions is the default CI provider in this repository.

Future local/self-hosted options:

- Drone CI
- Gitea Actions

CI must remain a quality protection layer. Do not remove lint, typecheck, tests, Docker builds or secret checks to hide failures.
