import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.tenant import Tenant


class KnowledgeTopic(Base, TimestampMixin):
    """
    Topic category for knowledge articles and help center.
    """
    __tablename__ = "knowledge_topics"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: f"cat-{uuid.uuid4().hex[:6]}",
        index=True
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[str] = mapped_column(String(50), default="help-buoy-outline", nullable=False)
    article_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class KnowledgeArticle(Base, TimestampMixin):
    """
    Knowledge base article for self-service help and AI RAG grounding.
    """
    __tablename__ = "knowledge_articles"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: f"kb-{uuid.uuid4().hex[:6]}",
        index=True
    )
    tenant_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    reads_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    helpful_yes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    helpful_no: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="articles")

    @property
    def helpful_percentage(self) -> str:
        total = self.helpful_yes + self.helpful_no
        if total == 0:
            return "100%"
        return f"{int((self.helpful_yes / total) * 100)}%"

