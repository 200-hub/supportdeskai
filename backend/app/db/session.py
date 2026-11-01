from typing import AsyncGenerator, Generator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

# ------------------------------------------------------------------------------
# Async Database Engine & Session (Primary for FastAPI async endpoints)
# ------------------------------------------------------------------------------
async_engine = create_async_engine(
    settings.async_database_uri,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
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
engine = create_engine(
    settings.sync_database_uri,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
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

