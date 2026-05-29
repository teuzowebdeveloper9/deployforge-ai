from app.core.config import settings
from app.providers.mistral_provider import MistralProvider
from app.schemas.agent import AgentResponse
from app.security.prompt_guard import PromptGuard
from app.services.prompt_builder import PromptBuilder


class AgentService:
    def __init__(self) -> None:
        self.prompt_builder = PromptBuilder()
        self.prompt_guard = PromptGuard()
        self.provider = MistralProvider()

    async def plan(self, prompt: str) -> AgentResponse:
        guarded_prompt = self.prompt_guard.annotate(prompt)
        messages = self.prompt_builder.build_messages(guarded_prompt)
        content, provider = await self.provider.complete(messages)
        return AgentResponse(
            mode="plan",
            response=content,
            provider=provider,
            model=settings.mistral_model,
        )

    async def analyze(self, prompt: str) -> AgentResponse:
        guarded_prompt = self.prompt_guard.annotate(f"Analise tecnicamente este pedido:\n{prompt}")
        messages = self.prompt_builder.build_messages(guarded_prompt)
        content, provider = await self.provider.complete(messages)
        return AgentResponse(
            mode="analyze",
            response=content,
            provider=provider,
            model=settings.mistral_model,
        )
