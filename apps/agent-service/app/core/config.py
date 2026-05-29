from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    port: int = 8001
    mistral_api_key: str = "replace_me"
    mistral_model: str = "mistral-large-latest"
    log_level: str = "INFO"

    model_config = SettingsConfigDict(extra="ignore")


settings = Settings()
