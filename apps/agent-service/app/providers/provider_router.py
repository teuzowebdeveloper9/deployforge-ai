from collections.abc import Sequence

from app.core.config import settings
from app.providers.anthropic_provider import AnthropicProvider
from app.providers.base import (
    AIProvider,
    Message,
    ProviderJsonResponse,
    ProviderStatus,
    ProviderTextResponse,
    local_plan_response,
)
from app.providers.gemini_provider import GeminiProvider
from app.providers.mistral_provider import MistralProvider
from app.providers.openai_compatible_provider import OpenAICompatibleProvider


DEFAULT_PROVIDER_ORDER = ("anthropic", "gemini", "openai", "openrouter", "deepseek", "mistral")


class AIProviderRouter:
    def __init__(self, providers: Sequence[AIProvider] | None = None) -> None:
        self._providers = list(providers) if providers is not None else None

    def statuses(self) -> list[ProviderStatus]:
        providers = self._providers_in_order()
        return [
            ProviderStatus(
                provider=provider.provider_name,
                model=provider.model,
                configured=provider.is_configured(),
                priority=index + 1,
            )
            for index, provider in enumerate(providers)
        ]

    async def complete(self, messages: list[Message]) -> ProviderTextResponse:
        providers = self._configured_providers()
        if not providers:
            return ProviderTextResponse(
                content=local_plan_response(
                    messages[-1]["content"],
                    "nenhuma chave de provider de IA foi configurada",
                ),
                provider="local-fallback",
                model="none",
            )

        failures: list[str] = []
        for provider in providers:
            try:
                result = await provider.complete(messages)
                return ProviderTextResponse(
                    content=result.content,
                    provider=result.provider,
                    model=result.model,
                    attempts=tuple(failures),
                )
            except Exception as exc:
                failures.append(f"{provider.provider_name}:{exc.__class__.__name__}")

        return ProviderTextResponse(
            content=local_plan_response(
                messages[-1]["content"],
                f"todos os providers configurados falharam ({', '.join(failures)})",
            ),
            provider="local-fallback",
            model="none",
            attempts=tuple(failures),
        )

    async def complete_json(self, messages: list[Message]) -> ProviderJsonResponse:
        providers = self._configured_providers()
        if not providers:
            return ProviderJsonResponse(
                payload={},
                provider="local-fallback",
                model="none",
                attempts=("no-configured-provider",),
            )

        failures: list[str] = []
        for provider in providers:
            try:
                result = await provider.complete_json(messages)
                return ProviderJsonResponse(
                    payload=result.payload,
                    provider=result.provider,
                    model=result.model,
                    attempts=tuple(failures),
                )
            except Exception as exc:
                failures.append(f"{provider.provider_name}:{exc.__class__.__name__}")

        return ProviderJsonResponse(
            payload={},
            provider="local-fallback",
            model="none",
            attempts=tuple(failures),
        )

    def _configured_providers(self) -> list[AIProvider]:
        return [provider for provider in self._providers_in_order() if provider.is_configured()]

    def _providers_in_order(self) -> list[AIProvider]:
        if self._providers is not None:
            return self._providers

        providers_by_name = {
            "anthropic": AnthropicProvider,
            "gemini": GeminiProvider,
            "openai": self._openai_provider,
            "openrouter": self._openrouter_provider,
            "deepseek": self._deepseek_provider,
            "mistral": MistralProvider,
        }
        return [providers_by_name[name]() for name in self._provider_order()]

    def _provider_order(self) -> list[str]:
        names = [
            name.strip().lower()
            for name in settings.ai_provider_order.split(",")
            if name.strip()
        ]
        names.extend(name for name in DEFAULT_PROVIDER_ORDER if name not in names)
        names = [name for name in names if name in DEFAULT_PROVIDER_ORDER and name != "mistral"]
        return [*dict.fromkeys(names), "mistral"]

    def _openai_provider(self) -> OpenAICompatibleProvider:
        return OpenAICompatibleProvider(
            provider_name="openai",
            credential=settings.openai_api_key,
            model=settings.openai_model,
            endpoint="https://api.openai.com/v1/chat/completions",
            max_tokens_field="max_completion_tokens",
        )

    def _openrouter_provider(self) -> OpenAICompatibleProvider:
        return OpenAICompatibleProvider(
            provider_name="openrouter",
            credential=settings.openrouter_api_key,
            model=settings.openrouter_model,
            endpoint="https://openrouter.ai/api/v1/chat/completions",
            extra_headers={"X-Title": "DeployForge AI"},
        )

    def _deepseek_provider(self) -> OpenAICompatibleProvider:
        return OpenAICompatibleProvider(
            provider_name="deepseek",
            credential=settings.deepseek_api_key,
            model=settings.deepseek_model,
            endpoint="https://api.deepseek.com/chat/completions",
            extra_body={"thinking": {"type": "enabled"}, "reasoning_effort": "high"},
            include_temperature=False,
        )
