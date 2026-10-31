from fastapi.testclient import TestClient
from unittest.mock import AsyncMock
from app.db.session import get_async_db
from app.main import app


def test_root_index(client: TestClient):
    """
    Test root GET / returns API index with version, status, and documentation URLs.
    """
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "version" in data
    assert "documentation" in data
    assert data["documentation"] == "/api/v1/docs"


def test_top_level_health(client: TestClient):
    """
    Test GET /health returns operational status for load balancers and probes.
    """
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "timestamp" in data
    assert "version" in data
    assert data["app_name"] == "SupportDeskAI Backend"


def test_v1_health_connected(client: TestClient):
    """
    Test GET /api/v1/health when database is connected.
    """
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"
    assert data["details"]["api_version"] == "v1"


def test_v1_health_db_unavailable(client: TestClient):
    """
    Test GET /api/v1/health gracefully reports database unavailability without crashing.
    """
    mock_failing_db = AsyncMock()
    mock_failing_db.execute.side_effect = ConnectionRefusedError("Database unreachable")

    async def override_failing_db():
        yield mock_failing_db

    app.dependency_overrides[get_async_db] = override_failing_db

    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "unavailable: ConnectionRefusedError" in data["database"]

    app.dependency_overrides.clear()
