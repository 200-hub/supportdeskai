import os
from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application configuration settings loaded from environment variables
    or .env file with validated defaults.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    PROJECT_NAME: str = "SupportDeskAI Backend"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Security & JWT Authentication
    SECRET_KEY: str = "insecure_dev_secret_key_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        env = os.environ.get("ENVIRONMENT", "development").lower()
        if env not in ("development", "testing", "dev", "test"):
            if v == "insecure_dev_secret_key_change_in_production" or len(v) < 32:
                raise ValueError(
                    "In production, SECRET_KEY must be a cryptographically secure key of at least 32 characters."
                )
        return v

    # Database Configuration (PostgreSQL)
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "supportdesk"
    POSTGRES_PASSWORD: str = "supportdesk_password"
    POSTGRES_DB: str = "supportdesk_db"
    DATABASE_URL: Optional[str] = None

    # AI Configuration (Optional external provider: openai, gemini, anthropic, or mock)
    AI_PROVIDER: Optional[str] = "mock"
    AI_API_KEY: Optional[str] = None
    AI_MODEL: Optional[str] = "gemini-1.5-flash"

    # Webhook Signature Secrets
    # Set these to the signing secrets provided by each provider's dashboard.
    # In production, missing secrets cause the endpoint to return 503.
    WHATSAPP_WEBHOOK_SECRET: Optional[str] = None   # Meta App Secret (HMAC-SHA256 key)
    EMAIL_WEBHOOK_SECRET: Optional[str] = None       # Mailgun Webhook Signing Key (or generic HMAC key)

    # Rate Limiting
    # TRUST_PROXY_HEADERS: set to True ONLY when behind a trusted reverse proxy
    # that rewrites X-Forwarded-For (nginx, AWS ALB, Cloudflare, etc.)
    TRUST_PROXY_HEADERS: bool = False

    # CORS configuration - Allow React Native / Expo development
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    @property
    def sync_database_uri(self) -> str:
        """
        Synchronous PostgreSQL URI for Alembic migrations and sync engines.
        """
        if self.DATABASE_URL:
            # Normalize to sync driver if necessary
            if self.DATABASE_URL.startswith("postgresql+asyncpg://"):
                return self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
            return self.DATABASE_URL
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def async_database_uri(self) -> str:
        """
        Asynchronous PostgreSQL URI for FastAPI SQLAlchemy async engine.
        """
        if self.DATABASE_URL:
            if self.DATABASE_URL.startswith("postgresql://"):
                return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
            return self.DATABASE_URL
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


settings = Settings()

