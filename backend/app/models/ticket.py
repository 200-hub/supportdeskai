import enum
import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.tenant import Tenant
    from app.models.user import User


class TicketStatus(str, enum.Enum):
    OPEN = "open"
    PENDING = "pending"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, enum.Enum):
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TicketChannel(str, enum.Enum):
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    CHAT = "chat"
    WEB = "web"


class MessageSenderType(str, enum.Enum):
    CUSTOMER = "customer"
    AGENT = "agent"
    INTERNAL_NOTE = "internal_note"
    ASSISTANT = "assistant"


class Ticket(Base, TimestampMixin):
    """
    Support Ticket entity representing an inquiry across omnichannel sources.
    """
    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: f"SD-{uuid.uuid4().hex[:6].upper()}",
        index=True
    )
    tenant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="General Support", nullable=False)
    channel: Mapped[TicketChannel] = mapped_column(
        Enum(TicketChannel, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=TicketChannel.WEB,
        nullable=False,
        index=True
    )
    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=TicketStatus.OPEN,
        nullable=False,
        index=True
    )
    priority: Mapped[TicketPriority] = mapped_column(
        Enum(TicketPriority, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=TicketPriority.MEDIUM,
        nullable=False,
        index=True
    )

    # Ownership & Assignment
    customer_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    assigned_to_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    team_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    is_spam: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    merged_into_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    sla_paused: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # SLA and AI Fields
    sla_remaining: Mapped[Optional[str]] = mapped_column(String(50), default="2h", nullable=True)
    sla_status: Mapped[str] = mapped_column(String(20), default="safe", nullable=False)  # 'safe', 'at-risk', 'breached'
    ai_confidence: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    ai_suggested_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_smart_draft: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="tickets")
    customer: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[customer_id],
        back_populates="created_tickets"
    )
    assignee: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[assigned_to_id],
        back_populates="assigned_tickets"
    )
    messages: Mapped[List["TicketMessage"]] = relationship(
        "TicketMessage",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="TicketMessage.created_at"
    )
    timeline: Mapped[List["TicketTimeline"]] = relationship(
        "TicketTimeline",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="TicketTimeline.created_at"
    )

    def __repr__(self) -> str:
        return f"<Ticket {self.id}: {self.subject[:30]} ({self.status})>"


class TicketMessage(Base, TimestampMixin):
    """
    Message or internal note inside a ticket thread.
    """
    __tablename__ = "ticket_messages"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: f"msg-{uuid.uuid4().hex[:8]}",
        index=True
    )
    ticket_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("tickets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    sender_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    sender_type: Mapped[MessageSenderType] = mapped_column(
        Enum(MessageSenderType, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=MessageSenderType.CUSTOMER,
        nullable=False
    )
    sender_name: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="messages")
    sender: Mapped[Optional["User"]] = relationship("User", back_populates="sent_messages")

    def __repr__(self) -> str:
        return f"<TicketMessage {self.id} on {self.ticket_id} by {self.sender_name}>"


class TicketTimeline(Base, TimestampMixin):
    """
    Audit log / event timeline item for a ticket.
    """
    __tablename__ = "ticket_timeline"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: f"t-{uuid.uuid4().hex[:8]}",
        index=True
    )
    ticket_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("tickets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    by: Mapped[str] = mapped_column(String(255), default="System", nullable=False)

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="timeline")

