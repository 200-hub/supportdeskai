import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.tenant import Tenant
    from app.models.ticket import Ticket


class Organization(Base, TimestampMixin):
    """
    Customer organization / account for B2B support desk management.
    """
    __tablename__ = "organizations"

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
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    domain: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant")
    contacts: Mapped[List["Contact"]] = relationship("Contact", back_populates="organization")

    def __repr__(self) -> str:
        return f"<Organization {self.name}>"


class Contact(Base, TimestampMixin):
    """
    End-user / customer contact record across omnichannel sources.
    """
    __tablename__ = "contacts"

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
    organization_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    whatsapp_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    avatar_initials: Mapped[str] = mapped_column(String(4), default="CU", nullable=False)
    custom_attributes_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant")
    organization: Mapped[Optional["Organization"]] = relationship("Organization", back_populates="contacts")

    def __repr__(self) -> str:
        return f"<Contact {self.name} ({self.email})>"

