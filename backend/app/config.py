from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AI Brand Workspace"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://brandwork_user:brandwork_password@localhost:5432/brandwork_db"

    # JWT
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Google Cloud Storage
    GCS_BUCKET_NAME: str = "brandwork-assets"
    GCS_CREDENTIALS_PATH: str = "./credentials/gcs-service-account.json"

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "dall-e-3"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
