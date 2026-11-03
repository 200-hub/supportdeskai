from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles
from app.db.session import get_async_db
from app.models.user import User, UserRole
from app.schemas.analytics import AnalyticsMetricsResponse
from app.services import analytics as analytics_service

router = APIRouter()


@router.get("/metrics", response_model=AnalyticsMetricsResponse)
async def get_metrics(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Retrieve omnichannel SLA compliance and performance metrics for the agent/admin dashboard.
    """
    return await analytics_service.get_tenant_analytics(
        db=db,
        tenant_id=current_user.tenant_id,
    )

