import uuid
from typing import Optional
from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class AutomationRule(Base, TimestampMixin):
    """
    Event-driven and time-based workflow automation rule.
    """
    __tablename__ = "automation_rules"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: f"auto-{uuid.uuid4().hex[:6]}",
        index=True
    )
    tenant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    trigger_event: Mapped[str] = mapped_column(String(50), default="ticket_created", nullable=False)
    # trigger_event: 'ticket_created', 'ticket_updated', 'status_changed'
    conditions_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    # conditions_json: [{"field": "priority", "op": "==", "value": "urgent"}]
    actions_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    # actions_json: [{"action": "set_status", "value": "open"}, {"action": "add_tag", "value": "vip"}]
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    execution_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    @property
    def conditions(self) -> list:
        import json
        return json.loads(self.conditions_json) if self.conditions_json else []

    @property
    def actions(self) -> list:
        import json
        return json.loads(self.actions_json) if self.actions_json else []

    def __repr__(self) -> str:
        return f"<AutomationRule {self.name} on {self.trigger_event}>"


class AutomationLog(Base, TimestampMixin):
    """
    Audit log of automation rule executions with loop prevention metadata.
    """
    __tablename__ = "automation_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True
    )
    tenant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    rule_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("automation_rules.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    ticket_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="success", nullable=False)  # success, skipped, loop_prevented
    details_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
