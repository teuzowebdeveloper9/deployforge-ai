# Agent Service

FastAPI service that builds safe DeployForge AI prompts and calls Mistral.

The service never edits files directly. It returns plans and analysis only. Future controlled changes must go through API-owned tools or MCP-style orchestration.

## Commands

```bash
pip install -e ".[dev]"
ruff check .
pytest
uvicorn app.main:app --reload --port 8001
```
