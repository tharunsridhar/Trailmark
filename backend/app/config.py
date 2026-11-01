from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# .env lives in the repo root, one level above backend/
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

    database_url: str = "sqlite:///./trailmark.db"
    jwt_secret: str = "change-me"
    jwt_expire_minutes: int = 60
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    frontend_origin: str = "http://localhost:3000"
    llm_api_key: str = ""
    llm_model: str = "claude-sonnet-5-5"
    # tried if the main model keeps failing, leave empty to skip
    llm_fallback_model: str = ""
    llm_base_url: str = "https://api.anthropic.com"
    # analysis results are saved here so the demo works without the AI service
    saved_results_dir: str = "saved_results"


@lru_cache
def get_settings() -> Settings:
    return Settings()
