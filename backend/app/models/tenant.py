import uuid
from typing import TYPE_CHECKING, List
from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.team import Team
    from app.models.ticket import Ticket
    from app.models.knowledge import KnowledgeArticle


class Tenant(Base, TimestampMixin):
    """
    Multi-tenant isolation root entity.
    All business data (users, tickets, articles, teams) is scoped to a tenant.
    """
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    plan: Mapped[str] = mapped_column(String(100), default="Standard", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    settings_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)

    # Relationships
    users: Mapped[List["User"]] = relationship(
        "User", back_populates="tenant", cascade="all, delete-orphan"
    )
    teams: Mapped[List["Team"]] = relationship(
        "Team", back_populates="tenant", cascade="all, delete-orphan"
    )
    tickets: Mapped[List["Ticket"]] = relationship(
        "Ticket", back_populates="tenant", cascade="all, delete-orphan"
    )
    articles: Mapped[List["KnowledgeArticle"]] = relationship(
        "KnowledgeArticle", back_populates="tenant", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Tenant {self.name} ({self.slug})>"

