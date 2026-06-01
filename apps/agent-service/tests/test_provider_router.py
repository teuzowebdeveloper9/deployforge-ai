import asyncio

from app.core.config import settings
from app.providers.base import Message, ProviderJsonResponse, ProviderTextResponse
from app.providers.provider_router import AIProviderRouter


class BrokenProvider:
    provider_name = "broken"
    model = "broken-model"

    def is_configured(self) -> bool:
        return True

    async def complete(self, messages: list[Message]) -> ProviderTextResponse:
        raise RuntimeError("provider failed")

    async def complete_json(self, messages: list[Message]) -> ProviderJsonResponse:
        raise RuntimeError("provider failed")


class WorkingProvider:
    provider_name = "working"
    model = "working-model"

    def is_configured(self) -> bool:
        return True

    async def complete(self, messages: list[Message]) -> ProviderTextResponse:
        return ProviderTextResponse(
            content="ok",
            provider=self.provider_name,
            model=self.model,
        )

    async def complete_json(self, messages: list[Message]) -> ProviderJsonResponse:
        return ProviderJsonResponse(
            payload={"files": []},
            provider=self.provider_name,
            model=self.model,
        )


def test_router_falls_back_to_next_provider() -> None:
    router = AIProviderRouter(providers=[BrokenProvider(), WorkingProvider()])
    result = asyncio.run(router.complete([{"role": "user", "content": "hello"}]))
    assert result.provider == "working"
    assert result.model == "working-model"
    assert result.attempts == ("broken:RuntimeError",)


def test_router_keeps_mistral_last_even_if_order_is_changed() -> None:
    previous_order = settings.ai_provider_order
    try:
        settings.ai_provider_order = "mistral,anthropic"
        providers = AIProviderRouter().statuses()
        assert providers[0].provider == "anthropic"
        assert providers[-1].provider == "mistral"
    finally:
        settings.ai_provider_order = previous_order
