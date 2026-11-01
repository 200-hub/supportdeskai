from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.schemas.notification import NotificationResponse


async def list_user_notifications(
    db: AsyncSession,
    user_id: str,
    tenant_id: str,
    unread_only: bool = False,
) -> List[Notification]:
    query = (
        select(Notification)
        .where(Notification.user_id == user_id, Notification.tenant_id == tenant_id)
        .order_by(Notification.created_at.desc())
    )
    if unread_only:
        query = query.where(Notification.is_read.is_(False))
    result = await db.execute(query)
    return list(result.scalars().all())


async def mark_notification_read(
    db: AsyncSession,
    notification_id: str,
    user_id: str,
    tenant_id: str,
) -> Notification:
    res = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
            Notification.tenant_id == tenant_id,
        )
    )
    notif = res.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return notif


async def create_system_notification(
    db: AsyncSession,
    tenant_id: str,
    user_id: str,
    title: str,
    description: str,
    notif_type: str = "ticket",
    ticket_id: Optional[str] = None,
) -> Notification:
    notif = Notification(
        tenant_id=tenant_id,
        user_id=user_id,
        title=title,
        description=description,
        type=notif_type,
        ticket_id=ticket_id,
        is_read=False,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif

