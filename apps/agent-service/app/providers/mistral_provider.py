from app.core.config import settings
from app.providers.openai_compatible_provider import OpenAICompatibleProvider


class MistralProvider(OpenAICompatibleProvider):
    def __init__(self) -> None:
        super().__init__(
            provider_name="mistral",
            credential=settings.mistral_api_key,
            model=settings.mistral_model,
            endpoint="https://api.mistral.ai/v1/chat/completions",
        )
