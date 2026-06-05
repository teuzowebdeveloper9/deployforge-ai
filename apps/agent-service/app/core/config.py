from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    port: int = 8001
    ai_provider_order: str = "anthropic,gemini,openai,openrouter,deepseek,mistral"
    ai_max_tokens: int = 24000
    ai_request_timeout_seconds: float = 120
    anthropic_api_key: str = "replace_me"
    anthropic_model: str = "claude-opus-4-8"
    gemini_api_key: str = "replace_me"
    google_api_key: str = "replace_me"
    gemini_model: str = "gemini-3.1-pro-preview"
    gemini_fallback_models: str = "gemini-2.5-flash,gemini-2.0-flash,gemini-flash-latest"
    openai_api_key: str = "replace_me"
    openai_model: str = "gpt-5.5"
    openrouter_api_key: str = "replace_me"
    openrouter_model: str = "anthropic/claude-opus-4.8"
    deepseek_api_key: str = "replace_me"
    deepseek_model: str = "deepseek-v4-pro"
    mistral_api_key: str = "replace_me"
    mistral_model: str = "mistral-large-latest"
    gateway_service_token: str = ""
    log_level: str = "INFO"

    model_config = SettingsConfigDict(extra="ignore")


settings = Settings()
