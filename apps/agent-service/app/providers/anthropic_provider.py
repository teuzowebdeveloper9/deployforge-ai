from typing import Any

import httpx

from app.core.config import settings
from app.providers.base import (
    Message,
    ProviderJsonResponse,
    ProviderTextResponse,
    has_api_key,
    parse_json_object,
)


class AnthropicProvider:
    provider_name = "anthropic"
    endpoint = "https://api.anthropic.com/v1/messages"

    def __init__(self) -> None:
        self.credential = settings.anthropic_api_key
        self.model = settings.anthropic_model

    def is_configured(self) -> bool:
        return has_api_key(self.credential)

    async def complete(self, messages: list[Message]) -> ProviderTextResponse:
        payload = await self._messages(messages, json_mode=False)
        return ProviderTextResponse(
            content=self._content_from_payload(payload),
            provider=self.provider_name,
            model=str(payload.get("model") or self.model),
        )

    async def complete_json(self, messages: list[Message]) -> ProviderJsonResponse:
        payload = await self._messages(messages, json_mode=True)
        return ProviderJsonResponse(
            payload=parse_json_object(self._content_from_payload(payload)),
            provider=self.provider_name,
            model=str(payload.get("model") or self.model),
        )

    async def _messages(self, messages: list[Message], json_mode: bool) -> dict[str, Any]:
        system, conversation = self._to_anthropic_messages(messages)
        if json_mode:
            system = (
                f"{system}\n\nRetorne somente um objeto JSON valido, sem markdown."
                if system
                else "Retorne somente um objeto JSON valido, sem markdown."
            )

        body: dict[str, Any] = {
            "model": self.model,
            "max_tokens": settings.ai_max_tokens,
            "messages": conversation,
        }
        if system:
            body["system"] = system

        async with httpx.AsyncClient(timeout=settings.ai_request_timeout_seconds) as client:
            response = await client.post(
                self.endpoint,
                headers={
                    "x-api-key": self.credential,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json=body,
            )
            response.raise_for_status()
            return response.json()

    def _to_anthropic_messages(self, messages: list[Message]) -> tuple[str, list[dict[str, str]]]:
        system_parts: list[str] = []
        conversation: list[dict[str, str]] = []
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            if role == "system":
                system_parts.append(content)
                continue
            if role not in {"user", "assistant"}:
                role = "user"
            conversation.append({"role": role, "content": content})

        if not conversation:
            conversation.append({"role": "user", "content": "\n\n".join(system_parts)})
            system_parts = []

        return "\n\n".join(part for part in system_parts if part), conversation

    def _content_from_payload(self, payload: dict[str, Any]) -> str:
        blocks = payload.get("content", [])
        if isinstance(blocks, list):
            return "\n".join(
                str(block.get("text", "")) for block in blocks if isinstance(block, dict)
            ).strip()
        return str(blocks)
