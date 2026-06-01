import asyncio

from app.api.routes.agent import health
from app.core.config import settings
from app.services.agent_service import AgentService


def disable_ai_keys() -> None:
    settings.anthropic_api_key = "replace_me"
    settings.gemini_api_key = "replace_me"
    settings.google_api_key = "replace_me"
    settings.openai_api_key = "replace_me"
    settings.openrouter_api_key = "replace_me"
    settings.deepseek_api_key = "replace_me"
    settings.mistral_api_key = "replace_me"


def test_health() -> None:
    response = health()
    assert response.status == "ok"
    assert response.service == "agent-service"


def test_provider_inventory_does_not_expose_keys() -> None:
    disable_ai_keys()
    response = AgentService().providers()
    providers = response.providers
    assert providers[0].provider == "anthropic"
    assert providers[1].provider == "gemini"
    assert providers[-1].provider == "mistral"
    assert all("api_key" not in provider.model_dump() for provider in providers)


def test_plan_fallback() -> None:
    disable_ai_keys()
    response = asyncio.run(AgentService().plan("Planeje um microserviço de billing"))
    assert response.mode == "plan"
    assert response.provider == "local-fallback"


def test_generate_app_fallback_returns_files() -> None:
    disable_ai_keys()
    response = asyncio.run(AgentService().generate_app("Crie um CRM simples"))
    assert response.mode == "generate-app"
    assert response.provider == "local-fallback"
    assert any(file.path == "preview/index.html" for file in response.files)
