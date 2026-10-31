from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_async_db
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="API v1 Health Check",
    description="Check the health status of the v1 API and optional database connectivity."
)
async def check_v1_health(db: AsyncSession = Depends(get_async_db)) -> HealthResponse:
    """
    Returns API v1 runtime health and probes the database connection.
    """
    db_status = "connected"
    try:
        # Quick ping to verify database connection
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unavailable: {type(e).__name__}"

    return HealthResponse(
        status="ok",
        app_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc),
        database=db_status,
        details={
            "api_version": "v1",
            "debug": str(settings.DEBUG)
        }
    )

