"""add columns the models use but no migration created

Revision ID: c7d8e9f0a1b2
Revises: b123c45e67f8
Create Date: 2026-11-09 12:00:00.000000

Without these, every query on users/tickets fails on a migrated database
(e.g. "column users.presence does not exist"), so login never works.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c7d8e9f0a1b2'
down_revision: Union[str, None] = 'b123c45e67f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('users') as batch:
        batch.add_column(sa.Column('presence', sa.String(length=20), nullable=False, server_default='offline'))
        batch.add_column(sa.Column('skills_json', sa.Text(), nullable=False, server_default='[]'))
        batch.add_column(sa.Column('max_concurrency', sa.Integer(), nullable=False, server_default='5'))
        batch.add_column(sa.Column('totp_secret', sa.String(length=64), nullable=True))
        batch.add_column(sa.Column('totp_enabled', sa.Boolean(), nullable=False, server_default=sa.false()))

    with op.batch_alter_table('tickets') as batch:
        batch.add_column(sa.Column('team_id', sa.String(length=36), nullable=True))
        batch.add_column(sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.false()))
        batch.add_column(sa.Column('is_spam', sa.Boolean(), nullable=False, server_default=sa.false()))
        batch.add_column(sa.Column('merged_into_id', sa.String(length=36), nullable=True))
        batch.add_column(sa.Column('sla_paused', sa.Boolean(), nullable=False, server_default=sa.false()))
        batch.create_index('ix_tickets_team_id', ['team_id'])
        batch.create_index('ix_tickets_is_deleted', ['is_deleted'])
        batch.create_index('ix_tickets_is_spam', ['is_spam'])

    # Visitor JWTs are ~290 chars; Postgres rejected them in VARCHAR(255).
    with op.batch_alter_table('web_chat_visitor_sessions') as batch:
        batch.alter_column('visitor_token', type_=sa.String(length=512), existing_nullable=False)


def downgrade() -> None:
    with op.batch_alter_table('web_chat_visitor_sessions') as batch:
        batch.alter_column('visitor_token', type_=sa.String(length=255), existing_nullable=False)

    with op.batch_alter_table('tickets') as batch:
        batch.drop_index('ix_tickets_is_spam')
        batch.drop_index('ix_tickets_is_deleted')
        batch.drop_index('ix_tickets_team_id')
        for col in ('sla_paused', 'merged_into_id', 'is_spam', 'is_deleted', 'team_id'):
            batch.drop_column(col)

    with op.batch_alter_table('users') as batch:
        for col in ('totp_enabled', 'totp_secret', 'max_concurrency', 'skills_json', 'presence'):
            batch.drop_column(col)
