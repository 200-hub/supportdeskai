from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_async_db
from app.models.user import User
from app.schemas.notification import NotificationResponse
from app.services import notification as notif_service

router = APIRouter()


@router.get("/", response_model=List[NotificationResponse])
async def list_notifications(
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    List user notifications.
    """
    return await notif_service.list_user_notifications(
        db=db,
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        unread_only=unread_only,
    )


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Mark an individual notification as read.
    """
    return await notif_service.mark_notification_read(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
    )

