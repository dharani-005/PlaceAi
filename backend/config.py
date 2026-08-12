"""
config.py — Central settings loaded from .env via pydantic-settings.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database
    database_url: str

    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480

    # Nexus AI API
    nexus_api_base_url: str
    nexus_api_key: str

    # Admin registration
    admin_registration_secret: str = "CHANGE_ME_ADMIN_SECRET"

    # File storage
    upload_dir: str = "uploads"
    max_file_size_mb: int = 5


@lru_cache()
def get_settings() -> Settings:
    return Settings()
