# Branch Impact Summary

This document summarizes what was delivered in each active/merged branch and the positive impact each change had on DeployForge AI.

Date: 2026-05-29

## Branch Overview

| Branch | PR | Status | Purpose |
| --- | --- | --- | --- |
| `main` | - | Active base | Stable integration branch for reviewed work. |
| `feature/deployforge-ai-mvp-scaffold` | [#1](https://github.com/teuzowebdeveloper9/deployforge-ai/pull/1), [#2](https://github.com/teuzowebdeveloper9/deployforge-ai/pull/2), [#3](https://github.com/teuzowebdeveloper9/deployforge-ai/pull/3) | Merged | MVP scaffold, local-first infrastructure and AI-first workspace experience. |
| `feature/tailwind-css-cleanup` | [#4](https://github.com/teuzowebdeveloper9/deployforge-ai/pull/4) | Open | Tailwind-first cleanup for global frontend styles. |

## `feature/deployforge-ai-mvp-scaffold`

This branch carried the main DeployForge AI MVP work and was merged through three PRs.

### PR #1 - MVP Scaffold

Delivered:

- Monorepo structure with `apps/`, `packages/`, `infra/`, `docs/` and GitHub Actions.
- Next.js frontend foundation.
- NestJS Core API with Prisma and PostgreSQL schema.
- FastAPI agent-service prepared for Mistral.
- Go runner-service prepared for quality gates.
- Dockerfiles and Docker Compose.
- Shared contracts/config packages.
- Initial docs for architecture, services, envs, agents and quality.
- Guardrails to avoid real env files and secret leaks.

Positive impact:

- Created a real runnable foundation instead of loose prototypes.
- Established clear ownership boundaries between web, API, agent-service and runner-service.
- Made local onboarding possible with `docker compose up --build`.
- Added quality and safety guardrails from the start.
- Preserved the rule that no skills system exists in this phase.

### PR #2 - Local-First Infrastructure Direction

Delivered:

- Replaced the original Azure-first MVP runtime expectation with a local/open-source stack.
- Documented local replacements:
  - PostgreSQL container instead of Azure Database for PostgreSQL.
  - MinIO-ready storage instead of Azure Blob Storage.
  - Redis/BullMQ instead of Azure Service Bus.
  - Local secret references now, Vault/SOPS later.
  - Local Docker Registry instead of Azure Container Registry.
  - Docker Compose instead of Azure Container Apps.
  - Grafana, Loki and Prometheus instead of Application Insights.
  - GitHub Actions instead of Azure Pipelines.
- Added local infra docs and env guidance.

Positive impact:

- Reduced dependency on paid cloud resources during MVP development.
- Made the project easier to run, debug and iterate locally.
- Kept cloud concepts mapped without forcing cloud infrastructure too early.
- Improved developer autonomy and lowered setup friction.

### PR #3 - AI Workspace MVP And Documentation

Delivered:

- Prompt-first home experience.
- Project workspace at `/apps/{appId}/agent`.
- Continuous chat per app/project.
- Agent activity timeline rendered inside the conversation.
- Markdown rendering for agent/user messages.
- Expanded preview panel with `Open` and `Expand` actions.
- Animated drawer sidebar with blur overlay and project navigation.
- API endpoints for project messages and steps:
  - `GET /apps/:appId/messages`
  - `POST /apps/:appId/messages`
  - `GET /apps/:appId/steps`
- Mistral-backed agent generation/planning improvements.
- Generated app file validation before snapshots.
- Better README covering product flow, architecture, envs, security, local infra, CI and limitations.

Positive impact:

- Moved the product from a CRUD-like interface toward an AI-first app builder experience.
- Let users continue work inside the same project instead of creating a new app for every prompt.
- Made agent progress visible through structured steps.
- Improved preview usability and made the generated app easier to inspect.
- Strengthened the API contract between frontend and backend for future streaming/SSE work.
- Made the repository easier to understand for contributors and reviewers.

## `feature/tailwind-css-cleanup`

This branch is open in PR #4.

Delivered:

- Converted `apps/web/app/globals.css` from manual CSS rules to a Tailwind-first `@layer base` approach.
- Replaced repeated global declarations with Tailwind `@apply` utilities.
- Removed custom global scrollbar styling.
- Kept only essential Tailwind directives and base global behavior.
- Updated the README to mention Tailwind-first frontend styling.

Positive impact:

- Reduces hand-written CSS surface area.
- Keeps styling closer to the project's Tailwind design system.
- Makes global UI behavior easier to maintain.
- Lowers the chance of CSS drift between global styles and component-level Tailwind classes.
- Creates a cleaner foundation for future design-system work.

## Cross-Cutting Positive Impact

The combined branch work improved DeployForge AI in these areas:

- Product clarity: the app now behaves like an AI builder workspace instead of a generic CRUD dashboard.
- Developer experience: local Docker Compose, clear env templates and docs make setup simpler.
- Architecture: services have clearer responsibilities and safer boundaries.
- User experience: prompt-first creation, persistent project context, visible agent steps and preview actions make the workflow easier to understand.
- Quality: lint, typecheck, tests, builds, no-env checks and secret scanning protect the repo.
- Security posture: real secrets are not committed, stored in the database or shown to the frontend.
- Maintainability: Tailwind-first styling and reusable frontend components reduce duplicated UI work.

## Current Notes

- PR #1, #2 and #3 are merged into `main`.
- PR #4 is open and should be merged after review/checks pass.
- The skills system is intentionally not implemented in this phase.
- Real streaming is still a future improvement; current progress is represented through persisted messages, steps and request-driven updates.
