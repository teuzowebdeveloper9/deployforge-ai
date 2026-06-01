# Agent Service

FastAPI service that builds safe DeployForge AI prompts and calls configured AI providers by priority.

The service never edits files directly. It returns plans and analysis only. Future controlled changes must go through API-owned tools or MCP-style orchestration.

Default remote provider order:

```txt
anthropic -> gemini -> openai -> openrouter -> deepseek -> mistral
```

Use `GET /agent/providers` to inspect configured providers without exposing key values.

Gemini first tries `GEMINI_MODEL` and then `GEMINI_FALLBACK_MODELS`, so a Pro quota failure can fall back to Flash before the service returns the local fallback.

## Commands

```bash
pip install -e ".[dev]"
ruff check .
pytest
uvicorn app.main:app --reload --port 8001
```
