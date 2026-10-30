"""Application settings and configuration management via Pydantic Settings."""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for GridBricks Wind Analytics backend."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "GridBricks Wind Forecast Analytics API"
    app_version: str = "0.1.0"
    debug: bool = False

    # Elexon BMRS API configuration
    elexon_base_url: str = "https://data.elexon.co.uk/bmrs/api/v1"
    request_timeout_seconds: float = 35.0

    # Default day-ahead market parameters
    # Midday (12:00 Europe/London) on D-1 represents the standard GB day-ahead auction clearing deadline
    default_decision_hour: int = 12

    # In-memory dataset cache capacity
    cache_max_size: int = 8

    # CORS configuration
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # Logging
    log_level: str = "INFO"


settings = Settings()

