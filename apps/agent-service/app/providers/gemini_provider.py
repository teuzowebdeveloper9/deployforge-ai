from typing import Any
from urllib.parse import quote

import httpx

from app.core.config import settings
from app.providers.base import (
    Message,
    ProviderJsonResponse,
    ProviderTextResponse,
    has_api_key,
    parse_json_object,
)


class GeminiProvider:
    provider_name = "gemini"

    def __init__(self) -> None:
        self.credential = (
            settings.gemini_api_key
            if has_api_key(settings.gemini_api_key)
            else settings.google_api_key
        )
        self.model = settings.gemini_model

    def is_configured(self) -> bool:
        return has_api_key(self.credential)

    async def complete(self, messages: list[Message]) -> ProviderTextResponse:
        payload, model = await self._generate_content(messages, json_mode=False)
        return ProviderTextResponse(
            content=self._content_from_payload(payload),
            provider=self.provider_name,
            model=model,
        )

    async def complete_json(self, messages: list[Message]) -> ProviderJsonResponse:
        payload, model = await self._generate_content(messages, json_mode=True)
        return ProviderJsonResponse(
            payload=parse_json_object(self._content_from_payload(payload)),
            provider=self.provider_name,
            model=model,
        )

    async def _generate_content(self, messages: list[Message], json_mode: bool) -> tuple[dict[str, Any], str]:
        last_error: httpx.HTTPStatusError | None = None
        for model in self._candidate_models():
            try:
                return await self._generate_content_for_model(messages, json_mode, model), model
            except httpx.HTTPStatusError as exc:
                last_error = exc
                if exc.response.status_code not in {400, 404, 429}:
                    raise
        if last_error:
            raise last_error
        raise RuntimeError("No Gemini model candidates are configured")

    async def _generate_content_for_model(
        self,
        messages: list[Message],
        json_mode: bool,
        model: str,
    ) -> dict[str, Any]:
        system, contents = self._to_gemini_messages(messages)
        generation_config: dict[str, Any] = {
            "temperature": 0.15 if json_mode else 0.2,
            "maxOutputTokens": settings.ai_max_tokens,
        }
        if json_mode:
            generation_config["responseMimeType"] = "application/json"

        body: dict[str, Any] = {
            "contents": contents,
            "generationConfig": generation_config,
        }
        if system:
            body["systemInstruction"] = {"parts": [{"text": system}]}

        endpoint = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{quote(model, safe='')}:generateContent"
        )
        async with httpx.AsyncClient(timeout=settings.ai_request_timeout_seconds) as client:
            response = await client.post(
                endpoint,
                headers={
                    "x-goog-api-key": self.credential,
                    "Content-Type": "application/json",
                },
                json=body,
            )
            response.raise_for_status()
            return response.json()

    def _candidate_models(self) -> list[str]:
        candidates = [
            self.model,
            *(
                model.strip()
                for model in settings.gemini_fallback_models.split(",")
                if model.strip()
            ),
        ]
        return list(dict.fromkeys(model.replace("models/", "") for model in candidates))

    def _to_gemini_messages(self, messages: list[Message]) -> tuple[str, list[dict[str, Any]]]:
        system_parts: list[str] = []
        contents: list[dict[str, Any]] = []
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            if role == "system":
                system_parts.append(content)
                continue
            gemini_role = "model" if role == "assistant" else "user"
            contents.append({"role": gemini_role, "parts": [{"text": content}]})

        if not contents:
            contents.append({"role": "user", "parts": [{"text": "\n\n".join(system_parts)}]})
            system_parts = []

        return "\n\n".join(part for part in system_parts if part), contents

    def _content_from_payload(self, payload: dict[str, Any]) -> str:
        parts = payload["candidates"][0]["content"].get("parts", [])
        return "\n".join(
            str(part.get("text", "")) for part in parts if isinstance(part, dict)
        ).strip()
