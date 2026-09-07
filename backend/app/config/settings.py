"""
Runtime settings for the API (not simulation constants - those live in
app/config/simulation_constants.py).

Values can be overridden through environment variables, e.g.
    SPACEAGRISIM_CORS_ORIGINS='["http://localhost:5173"]'
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="SPACEAGRISIM_", env_file=".env", extra="ignore")

    app_name: str = "SpaceAgriSim API"
    app_version: str = "0.1.0"
    api_prefix: str = "/api"

    # Origins allowed to call the API from a browser. The Vite dev server
    # proxies /api so this mostly matters when the frontend is served elsewhere.
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]


settings = Settings()
