import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Boolean, Enum, ForeignKey, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.tenant import Tenant


class ChannelType(str, enum.Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    WEB_CHAT = "web_chat"
    FORM = "form"


class Channel(Base, TimestampMixin):
    """
    Omnichannel communication pipeline configuration.
    """
    __tablename__ = "channels"

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
    type: Mapped[ChannelType] = mapped_column(
        Enum(ChannelType, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    config_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)

    tenant: Mapped["Tenant"] = relationship("Tenant")

    def __repr__(self) -> str:
        return f"<Channel {self.name} ({self.type.value})>"


class PublicForm(Base, TimestampMixin):
    """
    Public self-service intake form.
    """
    __tablename__ = "public_forms"

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
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    fields_schema_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    tenant: Mapped["Tenant"] = relationship("Tenant")

    def __repr__(self) -> str:
        return f"<PublicForm {self.title} ({self.slug})>"


class WebChatVisitorSession(Base, TimestampMixin):
    """
    Temporary or persistent web chat visitor session.
    """
    __tablename__ = "web_chat_visitor_sessions"

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
    visitor_token: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    visitor_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    visitor_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    session_status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    tenant: Mapped["Tenant"] = relationship("Tenant")

    def __repr__(self) -> str:
        return f"<WebChatVisitorSession {self.visitor_token[:8]}>"

