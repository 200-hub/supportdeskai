from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator, model_validator
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
    DEBUG: bool = False
    API_V1_STR: str = "/api/v1"

    # Security & JWT Authentication
    SECRET_KEY: str = "insecure_dev_secret_key_change_in_production"
    ALGORITHM: str = "HS256"
    # Short-lived; the app rotates it with the 30-day refresh token. Keeps a
    # stolen/logged-out access token useful for at most an hour.
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    # Lets /auth/register create agents/admins in an existing workspace.
    # Only for automated tests and local demos; keep False in production.
    ALLOW_STAFF_SELF_REGISTRATION: bool = False

    @model_validator(mode="after")
    def validate_secret_key(self) -> "Settings":
        # Uses the loaded ENVIRONMENT (env var or .env), not just os.environ.
        if self.ENVIRONMENT.lower() not in ("development", "testing", "dev", "test"):
            if self.SECRET_KEY == "insecure_dev_secret_key_change_in_production" or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "In production, SECRET_KEY must be a cryptographically secure key of at least 32 characters."
                )
        return self

    # Outbound email (password reset). Unset SMTP_HOST = no email is sent.
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: str = "no-reply@supportdesk.ai"

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
    WHATSAPP_VERIFY_TOKEN: Optional[str] = None     # Meta "Verify Token" for the GET handshake (falls back to the secret)
    EMAIL_WEBHOOK_SECRET: Optional[str] = None       # Mailgun Webhook Signing Key (or generic HMAC key)

    # Rate Limiting
    # TRUST_PROXY_HEADERS: set to True ONLY when behind a trusted reverse proxy
    # that rewrites X-Forwarded-For (nginx, AWS ALB, Cloudflare, etc.)
    TRUST_PROXY_HEADERS: bool = False
    # How many proxies sit in front of the app (Render/Railway: 1).
    TRUSTED_PROXY_HOPS: int = 1

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
        Synchronous database URI for Alembic migrations and sync engines.
        Supports PostgreSQL (psycopg2) and SQLite.
        """
        if self.DATABASE_URL:
            url = self.DATABASE_URL
            # Normalize async PostgreSQL to sync driver
            if url.startswith("postgresql+asyncpg://"):
                return url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")
            # Normalize async SQLite to sync driver
            if url.startswith("sqlite+aiosqlite://"):
                return url.replace("sqlite+aiosqlite://", "sqlite://")
            return url
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def async_database_uri(self) -> str:
        """
        Asynchronous database URI for FastAPI SQLAlchemy async engine.
        Supports PostgreSQL (asyncpg) and SQLite (aiosqlite).
        """
        if self.DATABASE_URL:
            url = self.DATABASE_URL
            # Normalize plain postgresql:// to asyncpg driver
            if url.startswith("postgresql://"):
                return url.replace("postgresql://", "postgresql+asyncpg://")
            # Normalize sync SQLite to async driver
            if url.startswith("sqlite://"):
                return url.replace("sqlite://", "sqlite+aiosqlite://")
            return url
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


settings = Settings()

