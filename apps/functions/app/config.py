from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = Field(default="development", alias="APP_ENV")
    cors_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        alias="BACKEND_CORS_ORIGINS",
    )
    ollama_base_url: str = Field(default="", alias="OLLAMA_BASE_URL")
    ollama_api_key: str = Field(default="", alias="OLLAMA_API_KEY")
    ollama_model: str = Field(default="kimi-k2.6:cloud", alias="OLLAMA_MODEL")
    ollama_timeout_seconds: int = Field(default=20, alias="OLLAMA_TIMEOUT_SECONDS")
    osrm_base_url: str = Field(default="https://router.project-osrm.org", alias="OSRM_BASE_URL")
    open_meteo_base_url: str = Field(default="https://api.open-meteo.com", alias="OPEN_METEO_BASE_URL")
    feature_live_tools: bool = Field(default=False, alias="FEATURE_LIVE_TOOLS")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

