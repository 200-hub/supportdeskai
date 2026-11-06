from typing import AsyncGenerator, Generator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

# Detect if we're using SQLite (no pool_pre_ping, needs check_same_thread=False)
_is_sqlite = settings.async_database_uri.startswith("sqlite")

# ------------------------------------------------------------------------------
# Async Database Engine & Session (Primary for FastAPI async endpoints)
# ------------------------------------------------------------------------------
async_engine = create_async_engine(
    settings.async_database_uri,
    echo=settings.DEBUG,
    future=True,
    **({"connect_args": {"check_same_thread": False}} if _is_sqlite else {"pool_pre_ping": True}),
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency yielding an async SQLAlchemy database session.
    Automatically closes session upon request completion.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# ------------------------------------------------------------------------------
# Sync Database Engine & Session (For Alembic, scripts, or sync tasks)
# ------------------------------------------------------------------------------
_sync_sqlite = settings.sync_database_uri.startswith("sqlite")
engine = create_engine(
    settings.sync_database_uri,
    echo=settings.DEBUG,
    future=True,
    **({"connect_args": {"check_same_thread": False}} if _sync_sqlite else {"pool_pre_ping": True}),
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def get_sync_db() -> Generator[Session, None, None]:
    """
    Dependency yielding a synchronous database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

