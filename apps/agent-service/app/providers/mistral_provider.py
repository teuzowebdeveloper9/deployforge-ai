import json
import re
from typing import Any

import httpx

from app.core.config import settings


class MistralProvider:
    endpoint = "https://api.mistral.ai/v1/chat/completions"

    async def complete(self, messages: list[dict[str, str]]) -> tuple[str, str]:
        if not settings.mistral_api_key or settings.mistral_api_key == "replace_me":
            return self._fallback_response(messages[-1]["content"]), "local-fallback"

        try:
            payload = await self._chat(messages, temperature=0.2, timeout=90)
            return payload["choices"][0]["message"]["content"], "mistral"
        except httpx.HTTPError as exc:
            return (
                f"Plano técnico local gerado porque a chamada Mistral falhou: {exc.__class__.__name__}.",
                "local-fallback",
            )

    async def complete_json(self, messages: list[dict[str, str]]) -> tuple[dict[str, Any], str]:
        if not settings.mistral_api_key or settings.mistral_api_key == "replace_me":
            return {}, "local-fallback"

        try:
            payload = await self._chat(messages, temperature=0.15, timeout=120, json_mode=True)
        except httpx.HTTPStatusError:
            payload = await self._chat(messages, temperature=0.15, timeout=120, json_mode=False)

        content = payload["choices"][0]["message"]["content"]
        return self._parse_json(content), "mistral"

    async def _chat(
        self,
        messages: list[dict[str, str]],
        temperature: float,
        timeout: float,
        json_mode: bool = False,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {
            "model": settings.mistral_model,
            "messages": messages,
            "temperature": temperature,
        }
        if json_mode:
            body["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                self.endpoint,
                headers={
                    "Authorization": f"Bearer {settings.mistral_api_key}",
                    "Content-Type": "application/json",
                },
                json=body,
            )
            response.raise_for_status()
            return response.json()

    def _parse_json(self, content: str) -> dict[str, Any]:
        try:
            payload = json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", content, flags=re.DOTALL)
            if not match:
                raise
            payload = json.loads(match.group(0))

        if not isinstance(payload, dict):
            raise ValueError("Mistral JSON response must be an object")
        return payload

    def _fallback_response(self, prompt: str) -> str:
        return (
            "Plano técnico local gerado sem chamar Mistral porque MISTRAL_API_KEY não foi configurada.\n\n"
            "1. Identificar o bounded context e os dados que o serviço realmente possui.\n"
            "2. Criar DTOs de entrada e manter regras em use cases/services, não em routers/controllers.\n"
            "3. Versionar snapshots por storage e manter metadados no PostgreSQL.\n"
            "4. Rodar quality gates no runner-service com timeout e logs redigidos.\n"
            "5. Tratar secrets apenas por referências, nunca por valor.\n\n"
            f"Prompt analisado: {prompt[:500]}"
        )
