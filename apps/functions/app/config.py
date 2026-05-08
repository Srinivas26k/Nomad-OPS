import os
from dataclasses import dataclass
from functools import lru_cache


@dataclass(frozen=True)
class Settings:
    app_env: str
    cors_origins: str
    ollama_base_url: str
    ollama_api_key: str
    ollama_model: str
    ollama_timeout_seconds: int
    osrm_base_url: str
    open_meteo_base_url: str
    feature_live_tools: bool

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings(
        app_env=os.getenv("APP_ENV", "development"),
        cors_origins=os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"),
        ollama_base_url=os.getenv("OLLAMA_BASE_URL", ""),
        ollama_api_key=os.getenv("OLLAMA_API_KEY", ""),
        ollama_model=os.getenv("OLLAMA_MODEL", "kimi-k2.6:cloud"),
        ollama_timeout_seconds=int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "20")),
        osrm_base_url=os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org"),
        open_meteo_base_url=os.getenv("OPEN_METEO_BASE_URL", "https://api.open-meteo.com"),
        feature_live_tools=os.getenv("FEATURE_LIVE_TOOLS", "false").lower() == "true",
    )
