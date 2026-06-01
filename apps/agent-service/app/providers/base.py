import json
import re
from dataclasses import dataclass, field
from typing import Any, Protocol


Message = dict[str, str]


@dataclass(frozen=True)
class ProviderTextResponse:
    content: str
    provider: str
    model: str
    attempts: tuple[str, ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class ProviderJsonResponse:
    payload: dict[str, Any]
    provider: str
    model: str
    attempts: tuple[str, ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class ProviderStatus:
    provider: str
    model: str
    configured: bool
    priority: int


class AIProvider(Protocol):
    provider_name: str
    model: str

    def is_configured(self) -> bool:
        ...

    async def complete(self, messages: list[Message]) -> ProviderTextResponse:
        ...

    async def complete_json(self, messages: list[Message]) -> ProviderJsonResponse:
        ...


def has_api_key(value: str | None) -> bool:
    if not value:
        return False
    normalized = value.strip().lower()
    return normalized not in {"replace_me", "changeme", "todo", "none", "null"}


def parse_json_object(content: str) -> dict[str, Any]:
    try:
        payload = json.loads(content)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", content, flags=re.DOTALL)
        if not match:
            raise
        payload = json.loads(match.group(0))

    if not isinstance(payload, dict):
        raise ValueError("AI JSON response must be an object")
    return payload


def local_plan_response(prompt: str, reason: str) -> str:
    return (
        f"Plano tecnico local gerado porque {reason}.\n\n"
        "1. Identificar o bounded context e os dados que o servico realmente possui.\n"
        "2. Criar DTOs de entrada e manter regras em use cases/services, nao em routers/controllers.\n"
        "3. Versionar snapshots por storage e manter metadados no PostgreSQL.\n"
        "4. Rodar quality gates no runner-service com timeout e logs redigidos.\n"
        "5. Tratar secrets apenas por referencias, nunca por valor.\n\n"
        f"Prompt analisado: {prompt[:500]}"
    )
