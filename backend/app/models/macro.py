import uuid
from typing import Optional
from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Macro(Base, TimestampMixin):
    """
    Agent canned responses and batch action execution macros.
    """
    __tablename__ = "macros"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: f"macro-{uuid.uuid4().hex[:6]}",
        index=True
    )
    tenant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    actions_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
    # actions_json format:
    # {
    #   "response_text": "Hi {{customer.name}}, we have escalated...",
    #   "status": "pending",
    #   "priority": "high",
    #   "tags": ["escalated"]
    # }
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    @property
    def actions(self) -> dict:
        import json
        return json.loads(self.actions_json) if self.actions_json else {}

    def __repr__(self) -> str:
        return f"<Macro {self.title}>"
