import uuid
from typing import Optional
from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class SLAPolicy(Base, TimestampMixin):
    """
    SLA Policy defining response and resolution deadlines per priority tier.
    """
    __tablename__ = "sla_policies"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: f"sla-{uuid.uuid4().hex[:6]}",
        index=True
    )
    tenant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)  # urgent, high, medium, low
    first_response_time_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    resolution_time_minutes: Mapped[int] = mapped_column(Integer, default=240, nullable=False)
    business_hours_only: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    def __repr__(self) -> str:
        return f"<SLAPolicy {self.name} ({self.priority})>"

