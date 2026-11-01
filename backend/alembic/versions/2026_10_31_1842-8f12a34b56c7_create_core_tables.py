"""create_core_tables

Revision ID: 8f12a34b56c7
Revises: 4f891fb2cd8b
Create Date: 2026-10-31 18:42:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8f12a34b56c7"
down_revision: Union[str, None] = "4f891fb2cd8b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Tenants table
    op.create_table(
        "tenants",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("plan", sa.String(length=100), nullable=False, server_default="Standard"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("settings_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tenants_id", "tenants", ["id"], unique=False)
    op.create_index("ix_tenants_slug", "tenants", ["slug"], unique=True)

    # 2. Teams table
    op.create_table(
        "teams",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_teams_id", "teams", ["id"], unique=False)
    op.create_index("ix_teams_tenant_id", "teams", ["tenant_id"], unique=False)

    # 3. Users table
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False, server_default="customer"),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("company", sa.String(length=255), nullable=True),
        sa.Column("avatar_initials", sa.String(length=4), nullable=False, server_default="SD"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("team_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["team_id"], ["teams.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_tenant_id", "users", ["tenant_id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=False)
    op.create_index("ix_users_role", "users", ["role"], unique=False)
    op.create_index("ix_users_team_id", "users", ["team_id"], unique=False)

    # 4. Tickets table
    op.create_table(
        "tickets",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=False),
        sa.Column("subject", sa.String(length=500), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False, server_default="General Support"),
        sa.Column("channel", sa.String(length=20), nullable=False, server_default="web"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="open"),
        sa.Column("priority", sa.String(length=20), nullable=False, server_default="medium"),
        sa.Column("customer_id", sa.String(length=36), nullable=True),
        sa.Column("assigned_to_id", sa.String(length=36), nullable=True),
        sa.Column("sla_remaining", sa.String(length=50), nullable=True, server_default="2h"),
        sa.Column("sla_status", sa.String(length=20), nullable=False, server_default="safe"),
        sa.Column("ai_confidence", sa.String(length=20), nullable=True),
        sa.Column("ai_suggested_action", sa.Text(), nullable=True),
        sa.Column("ai_summary", sa.Text(), nullable=True),
        sa.Column("ai_smart_draft", sa.Text(), nullable=True),
        sa.Column("tags_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["assigned_to_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["customer_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tickets_id", "tickets", ["id"], unique=False)
    op.create_index("ix_tickets_tenant_id", "tickets", ["tenant_id"], unique=False)
    op.create_index("ix_tickets_status", "tickets", ["status"], unique=False)
    op.create_index("ix_tickets_priority", "tickets", ["priority"], unique=False)
    op.create_index("ix_tickets_channel", "tickets", ["channel"], unique=False)
    op.create_index("ix_tickets_customer_id", "tickets", ["customer_id"], unique=False)
    op.create_index("ix_tickets_assigned_to_id", "tickets", ["assigned_to_id"], unique=False)

    # 5. Ticket Messages table
    op.create_table(
        "ticket_messages",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("ticket_id", sa.String(length=36), nullable=False),
        sa.Column("sender_id", sa.String(length=36), nullable=True),
        sa.Column("sender_type", sa.String(length=20), nullable=False, server_default="customer"),
        sa.Column("sender_name", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["ticket_id"], ["tickets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ticket_messages_id", "ticket_messages", ["id"], unique=False)
    op.create_index("ix_ticket_messages_ticket_id", "ticket_messages", ["ticket_id"], unique=False)

    # 6. Ticket Timeline table
    op.create_table(
        "ticket_timeline",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("ticket_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("by", sa.String(length=255), nullable=False, server_default="System"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["ticket_id"], ["tickets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ticket_timeline_id", "ticket_timeline", ["id"], unique=False)
    op.create_index("ix_ticket_timeline_ticket_id", "ticket_timeline", ["ticket_id"], unique=False)

    # 7. Knowledge Topics table
    op.create_table(
        "knowledge_topics",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=100), nullable=False),
        sa.Column("icon", sa.String(length=50), nullable=False, server_default="help-buoy-outline"),
        sa.Column("article_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_knowledge_topics_id", "knowledge_topics", ["id"], unique=False)

    # 8. Knowledge Articles table
    op.create_table(
        "knowledge_articles",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("reads_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("helpful_yes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("helpful_no", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_knowledge_articles_id", "knowledge_articles", ["id"], unique=False)
    op.create_index("ix_knowledge_articles_tenant_id", "knowledge_articles", ["tenant_id"], unique=False)
    op.create_index("ix_knowledge_articles_title", "knowledge_articles", ["title"], unique=False)
    op.create_index("ix_knowledge_articles_category", "knowledge_articles", ["category"], unique=False)


def downgrade() -> None:
    op.drop_table("knowledge_articles")
    op.drop_table("knowledge_topics")
    op.drop_table("ticket_timeline")
    op.drop_table("ticket_messages")
    op.drop_table("tickets")
    op.drop_table("users")
    op.drop_table("teams")
    op.drop_table("tenants")

