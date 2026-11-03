"""add user/ticket columns present in models but missing from migrations

Revision ID: c5d6e7f8a9b0
Revises: b123c45e67f8
Create Date: 2026-11-03 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c5d6e7f8a9b0'
down_revision: Union[str, None] = 'b123c45e67f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # server_default backfills existing rows so NOT NULL succeeds.
    with op.batch_alter_table('users') as b:
        b.add_column(sa.Column('presence', sa.String(length=20), nullable=False, server_default='offline'))
        b.add_column(sa.Column('skills_json', sa.Text(), nullable=False, server_default='[]'))
        b.add_column(sa.Column('max_concurrency', sa.Integer(), nullable=False, server_default='5'))
        b.add_column(sa.Column('totp_secret', sa.String(length=64), nullable=True))
        b.add_column(sa.Column('totp_enabled', sa.Boolean(), nullable=False, server_default=sa.false()))

    with op.batch_alter_table('tickets') as b:
        b.add_column(sa.Column('team_id', sa.String(length=36), nullable=True))
        b.add_column(sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.false()))
        b.add_column(sa.Column('is_spam', sa.Boolean(), nullable=False, server_default=sa.false()))
        b.add_column(sa.Column('merged_into_id', sa.String(length=36), nullable=True))
        b.add_column(sa.Column('sla_paused', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_index('ix_tickets_team_id', 'tickets', ['team_id'])
    op.create_index('ix_tickets_is_deleted', 'tickets', ['is_deleted'])
    op.create_index('ix_tickets_is_spam', 'tickets', ['is_spam'])

    # Visitor JWTs are ~290 chars; 255 overflowed on Postgres.
    with op.batch_alter_table('web_chat_visitor_sessions') as b:
        b.alter_column('visitor_token', existing_type=sa.String(length=255),
                       type_=sa.String(length=512), existing_nullable=False)


def downgrade() -> None:
    with op.batch_alter_table('web_chat_visitor_sessions') as b:
        b.alter_column('visitor_token', existing_type=sa.String(length=512),
                       type_=sa.String(length=255), existing_nullable=False)

    op.drop_index('ix_tickets_is_spam', table_name='tickets')
    op.drop_index('ix_tickets_is_deleted', table_name='tickets')
    op.drop_index('ix_tickets_team_id', table_name='tickets')
    with op.batch_alter_table('tickets') as b:
        for col in ('sla_paused', 'merged_into_id', 'is_spam', 'is_deleted', 'team_id'):
            b.drop_column(col)

    with op.batch_alter_table('users') as b:
        for col in ('totp_enabled', 'totp_secret', 'max_concurrency', 'skills_json', 'presence'):
            b.drop_column(col)
