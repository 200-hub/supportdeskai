import asyncio
import os
import sys
from pathlib import Path
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# ---------------------------------------------------------------------------
# Rate-limit bucket reset helper (imported after sys.path is set up)
# ---------------------------------------------------------------------------
# Imported lazily inside the fixture to avoid circular import at module level.
def _reset_all_rate_limit_buckets():
    """Clear every in-process rate-limit token bucket so tests don't bleed."""
    try:
        from app.core.rate_limit import _BUCKETS, _LOCK
        with _LOCK:
            for bucket in _BUCKETS.values():
                bucket.clear()
    except Exception:
        pass  # If the module isn't loaded yet, there's nothing to clear.

# Ensure test settings
os.environ["ENVIRONMENT"] = "testing"
os.environ["DEBUG"] = "False"
os.environ["AI_PROVIDER"] = "mock"


@pytest.fixture(autouse=True)
def reset_rate_limit_buckets():
    """
    Autouse fixture that resets ALL in-process rate-limit token buckets before
    every test and again after it completes.

    The TestClient always uses the host "testclient", so all test requests share
    the same bucket key.  Without this reset, a rate-limit test that fills a
    bucket contaminates every subsequent test that exercises the same endpoint.
    This fixture is the single canonical place to handle that cleanup so
    individual tests do not each need to call _reset_bucket().
    """
    _reset_all_rate_limit_buckets()
    yield
    _reset_all_rate_limit_buckets()

from app import models as app_models  # noqa: F401 - load all models into Base.metadata
from app.db.base import Base
from app.db.session import get_async_db
from app.main import app as fastapi_app

TEST_DB_PATH = backend_dir / "test_app.db"
TEST_DB_URL = f"sqlite+aiosqlite:///{TEST_DB_PATH}"

test_engine = create_async_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """
    Create tables in SQLite test database before tests, remove after session.
    """
    async def init_models():
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

    asyncio.run(init_models())
    yield
    async def cleanup_models():
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await test_engine.dispose()
        if TEST_DB_PATH.exists():
            try:
                TEST_DB_PATH.unlink()
            except Exception:
                pass

    asyncio.run(cleanup_models())


@pytest.fixture
def client() -> TestClient:
    """
    Synchronous FastAPI TestClient with isolated mock database for basic tests.
    """
    mock_db = AsyncMock()
    mock_db.execute.return_value = None

    async def override_get_async_db():
        yield mock_db

    fastapi_app.dependency_overrides[get_async_db] = override_get_async_db
    with TestClient(fastapi_app) as test_client:
        yield test_client
    fastapi_app.dependency_overrides.clear()


@pytest.fixture
def db_client() -> TestClient:
    """
    FastAPI TestClient wired to the real SQLite async test database.
    """
    async def override_real_async_db():
        async with TestingSessionLocal() as session:
            yield session

    fastapi_app.dependency_overrides[get_async_db] = override_real_async_db
    with TestClient(fastapi_app) as test_client:
        yield test_client
    fastapi_app.dependency_overrides.clear()
