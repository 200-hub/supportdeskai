import uuid
from typing import Optional
from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class RoutingRule(Base, TimestampMixin):
    """
    Ticket assignment and dispatch routing rule.
    """
    __tablename__ = "routing_rules"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: f"route-{uuid.uuid4().hex[:6]}",
        index=True
    )
    tenant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    strategy: Mapped[str] = mapped_column(String(50), default="round_robin", nullable=False)  # 'round_robin', 'least_loaded', 'skills_based'
    target_team_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    required_skill: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    channel: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    priority_order: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    def __repr__(self) -> str:
        return f"<RoutingRule {self.name} ({self.strategy})>"

