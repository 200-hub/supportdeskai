import enum
import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.tenant import Tenant
    from app.models.team import Team
    from app.models.ticket import Ticket, TicketMessage


class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    AGENT = "agent"
    ADMIN = "admin"


class User(Base, TimestampMixin):
    """
    User entity supporting customer, agent, and administrator roles.
    Scoped to a specific tenant.
    """
    __tablename__ = "users"

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
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=UserRole.CUSTOMER,
        nullable=False,
        index=True
    )
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    company: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    avatar_initials: Mapped[str] = mapped_column(String(4), default="SD", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    presence: Mapped[str] = mapped_column(String(20), default="offline", nullable=False)  # 'online', 'away', 'offline'
    skills_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    max_concurrency: Mapped[int] = mapped_column(default=5, nullable=False)
    totp_secret: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    totp_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    team_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("teams.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="users")
    team: Mapped[Optional["Team"]] = relationship("Team", back_populates="members")
    assigned_tickets: Mapped[List["Ticket"]] = relationship(
        "Ticket",
        foreign_keys="Ticket.assigned_to_id",
        back_populates="assignee"
    )
    created_tickets: Mapped[List["Ticket"]] = relationship(
        "Ticket",
        foreign_keys="Ticket.customer_id",
        back_populates="customer"
    )
    sent_messages: Mapped[List["TicketMessage"]] = relationship(
        "TicketMessage",
        back_populates="sender"
    )

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role})>"

