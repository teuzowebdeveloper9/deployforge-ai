# AI Provider Routing

DeployForge AI now routes agent requests through a prioritized provider list instead of binding the agent-service to one Mistral-only client.

The goal is to use the strongest configured coding provider first, keep cheaper or broader fallbacks available, and leave Mistral as the final remote fallback.

## Runtime Flow

1. The agent-service reads provider configuration from environment variables.
2. It builds an inventory of configured providers without exposing key values.
3. For each agent request, it tries configured providers in priority order.
4. If a provider is missing a real key, it is skipped.
5. If a provider fails, the router records the failure and moves to the next configured provider.
6. If every configured provider fails, the service returns the deterministic local fallback so the MVP still responds.

Default provider priority:

```txt
anthropic -> gemini -> openai -> openrouter -> deepseek -> mistral
```

Mistral is intentionally kept last. The order can be changed with `AI_PROVIDER_ORDER`, but unknown provider names are ignored.

## Provider Inventory Endpoint

Use this endpoint to confirm what the agent-service can use at runtime:

```bash
curl http://localhost:8001/agent/providers
```

Example response:

```json
{
  "providers": [
    {
      "provider": "anthropic",
      "model": "claude-opus-4-8",
      "configured": false,
      "priority": 1
    },
    {
      "provider": "gemini",
      "model": "gemini-3.1-pro-preview",
      "configured": true,
      "priority": 2
    },
    {
      "provider": "mistral",
      "model": "mistral-large-latest",
      "configured": false,
      "priority": 6
    }
  ]
}
```

The endpoint returns only provider names, selected models, configured status and priority. It never returns API keys.

## Environment Variables

The agent-service supports these provider settings:

```txt
AI_PROVIDER_ORDER="anthropic,gemini,openai,openrouter,deepseek,mistral"
AI_MAX_TOKENS=24000
AI_REQUEST_TIMEOUT_SECONDS=120

ANTHROPIC_API_KEY="replace_me"
ANTHROPIC_MODEL="claude-opus-4-8"

GEMINI_API_KEY="replace_me"
GOOGLE_API_KEY="replace_me"
GEMINI_MODEL="gemini-3.1-pro-preview"
GEMINI_FALLBACK_MODELS="gemini-2.5-flash,gemini-2.0-flash,gemini-flash-latest"

OPENAI_API_KEY="replace_me"
OPENAI_MODEL="gpt-5.5"

OPENROUTER_API_KEY="replace_me"
OPENROUTER_MODEL="anthropic/claude-opus-4.8"

DEEPSEEK_API_KEY="replace_me"
DEEPSEEK_MODEL="deepseek-v4-pro"

MISTRAL_API_KEY="replace_me"
MISTRAL_MODEL="mistral-large-latest"
```

Use real key values only in your local runtime environment, shell, Docker secret mechanism or deployment secret store. Do not commit real `.env` files.

For Gemini, either `GEMINI_API_KEY` or `GOOGLE_API_KEY` can configure the provider.

## Gemini Model Fallback

Gemini has an internal model fallback before the router moves to the next provider.

The service tries:

1. `GEMINI_MODEL`
2. each model listed in `GEMINI_FALLBACK_MODELS`

This handles common local failures where a Pro or preview model returns quota or access errors, while a Flash model is available on the same key.

## OpenAI-Compatible Providers

OpenAI, OpenRouter, DeepSeek and Mistral share the OpenAI-compatible provider wrapper. Each one supplies its own base URL, API key and model setting.

This keeps the router behavior consistent while still allowing each provider to be enabled independently.

## Request Types

The same provider router is used for:

- `POST /agent/plan`
- `POST /agent/analyze`
- `POST /agent/generate-app`

For `generate-app`, the provider response is parsed into a bounded generated app payload. The Core API validates the payload, creates a source snapshot, stores preview HTML, creates an app version and runs a quality gate.

## Failure Behavior

Provider failures do not stop the request immediately. The router moves down the priority list until one provider succeeds.

The final agent response includes the provider and model used for successful remote responses. If all remote providers fail, the local fallback is returned with a deterministic response so the UI can keep working.

Common failure causes:

- missing or placeholder API key
- model not enabled for the account
- quota exceeded
- provider timeout
- provider HTTP error
- invalid JSON in a generated app response

## Files Changed

Main agent-service provider code:

- `apps/agent-service/app/providers/provider_router.py`
- `apps/agent-service/app/providers/base.py`
- `apps/agent-service/app/providers/anthropic_provider.py`
- `apps/agent-service/app/providers/gemini_provider.py`
- `apps/agent-service/app/providers/openai_compatible_provider.py`
- `apps/agent-service/app/providers/mistral_provider.py`
- `apps/agent-service/app/core/config.py`
- `apps/agent-service/app/services/agent_service.py`
- `apps/agent-service/app/api/routes/agent.py`
- `apps/agent-service/app/schemas/agent.py`

Core API and web follow-up generation flow:

- `apps/api/src/modules/agents/application/use-cases/send-agent-message.use-case.ts`
- `apps/api/src/modules/agents/agents.module.ts`
- `apps/web/src/components/ProjectWorkspace.tsx`
- `apps/web/src/lib/api.ts`

Safety hardening:

- `apps/runner-service/internal/executor/executor.go`

## Validation

Run these checks after changing provider routing:

```bash
cd apps/agent-service
ruff check .
pytest
```

```bash
cd apps/api
npm run lint
npm run typecheck
npm run build
```

```bash
cd apps/web
npm run lint
npm run typecheck
npm run build
```

```bash
npm run check:no-env
npm run secret-scan
git diff --check
```

For local runtime validation:

```bash
docker compose up --build
curl http://localhost:8001/agent/providers
```
