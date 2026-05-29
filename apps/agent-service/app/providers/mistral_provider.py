import httpx

from app.core.config import settings


class MistralProvider:
    endpoint = "https://api.mistral.ai/v1/chat/completions"

    async def complete(self, messages: list[dict[str, str]]) -> tuple[str, str]:
        if not settings.mistral_api_key or settings.mistral_api_key == "replace_me":
            return self._fallback_response(messages[-1]["content"]), "local-fallback"

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                self.endpoint,
                headers={
                    "Authorization": f"Bearer {settings.mistral_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.mistral_model,
                    "messages": messages,
                    "temperature": 0.2,
                },
            )
            response.raise_for_status()
            payload = response.json()
            return payload["choices"][0]["message"]["content"], "mistral"

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
