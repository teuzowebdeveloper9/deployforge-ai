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


class OpenAICompatibleProvider:
    def __init__(
        self,
        *,
        provider_name: str,
        credential: str,
        model: str,
        endpoint: str,
        extra_headers: dict[str, str] | None = None,
        extra_body: dict[str, Any] | None = None,
        max_tokens_field: str | None = "max_tokens",
        include_temperature: bool = True,
    ) -> None:
        self.provider_name = provider_name
        self.credential = credential
        self.model = model
        self.endpoint = endpoint
        self.extra_headers = extra_headers or {}
        self.extra_body = extra_body or {}
        self.max_tokens_field = max_tokens_field
        self.include_temperature = include_temperature

    def is_configured(self) -> bool:
        return has_api_key(self.credential)

    async def complete(self, messages: list[Message]) -> ProviderTextResponse:
        payload = await self._chat(messages, json_mode=False)
        content = self._content_from_payload(payload)
        return ProviderTextResponse(
            content=content,
            provider=self.provider_name,
            model=str(payload.get("model") or self.model),
        )

    async def complete_json(self, messages: list[Message]) -> ProviderJsonResponse:
        try:
            payload = await self._chat(messages, json_mode=True)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code not in {400, 422}:
                raise
            payload = await self._chat(messages, json_mode=False)

        content = self._content_from_payload(payload)
        return ProviderJsonResponse(
            payload=parse_json_object(content),
            provider=self.provider_name,
            model=str(payload.get("model") or self.model),
        )

    async def _chat(self, messages: list[Message], json_mode: bool) -> dict[str, Any]:
        body: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            **self.extra_body,
        }
        if self.include_temperature:
            body["temperature"] = 0.15 if json_mode else 0.2
        if self.max_tokens_field:
            body[self.max_tokens_field] = settings.ai_max_tokens
        if json_mode:
            body["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {self.credential}",
            "Content-Type": "application/json",
            **self.extra_headers,
        }
        async with httpx.AsyncClient(timeout=settings.ai_request_timeout_seconds) as client:
            response = await client.post(self.endpoint, headers=headers, json=body)
            response.raise_for_status()
            return response.json()

    def _content_from_payload(self, payload: dict[str, Any]) -> str:
        message = payload["choices"][0]["message"]
        content = message.get("content", "")
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            return "\n".join(self._content_part_to_text(part) for part in content).strip()
        return str(content)

    def _content_part_to_text(self, part: Any) -> str:
        if isinstance(part, str):
            return part
        if isinstance(part, dict):
            return str(part.get("text") or part.get("content") or "")
        return ""
