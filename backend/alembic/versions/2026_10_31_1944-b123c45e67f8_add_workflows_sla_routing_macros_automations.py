"""add workflows sla routing macros automations

Revision ID: b123c45e67f8
Revises: 9a23c45d67e8
Create Date: 2026-10-31 19:44:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b123c45e67f8'
down_revision: Union[str, None] = '9a23c45d67e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. UserInvitations
    op.create_table(
        'user_invitations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('tenant_id', sa.String(length=36), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('invitation_token', sa.String(length=128), unique=True, nullable=False),
        sa.Column('is_accepted', sa.Boolean(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_user_invitations_tenant_id', 'user_invitations', ['tenant_id'])
    op.create_index('ix_user_invitations_email', 'user_invitations', ['email'])

    # 2. SLAPolicies
    op.create_table(
        'sla_policies',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('tenant_id', sa.String(length=36), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('priority', sa.String(length=20), nullable=False),
        sa.Column('first_response_time_minutes', sa.Integer(), nullable=False),
        sa.Column('resolution_time_minutes', sa.Integer(), nullable=False),
        sa.Column('business_hours_only', sa.Boolean(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_sla_policies_tenant_id', 'sla_policies', ['tenant_id'])

    # 3. RoutingRules
    op.create_table(
        'routing_rules',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('tenant_id', sa.String(length=36), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('strategy', sa.String(length=50), nullable=False),
        sa.Column('target_team_id', sa.String(length=36), nullable=True),
        sa.Column('required_skill', sa.String(length=100), nullable=True),
        sa.Column('channel', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('priority_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_routing_rules_tenant_id', 'routing_rules', ['tenant_id'])

    # 4. Macros
    op.create_table(
        'macros',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('tenant_id', sa.String(length=36), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('actions_json', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_macros_tenant_id', 'macros', ['tenant_id'])

    # 5. AutomationRules & AutomationLogs
    op.create_table(
        'automation_rules',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('tenant_id', sa.String(length=36), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('trigger_event', sa.String(length=50), nullable=False),
        sa.Column('conditions_json', sa.Text(), nullable=False),
        sa.Column('actions_json', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('execution_count', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_automation_rules_tenant_id', 'automation_rules', ['tenant_id'])

    op.create_table(
        'automation_logs',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('tenant_id', sa.String(length=36), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('rule_id', sa.String(length=36), nullable=False),
        sa.Column('ticket_id', sa.String(length=36), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('details_json', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_automation_logs_tenant_id', 'automation_logs', ['tenant_id'])


def downgrade() -> None:
    op.drop_table('automation_logs')
    op.drop_table('automation_rules')
    op.drop_table('macros')
    op.drop_table('routing_rules')
    op.drop_table('sla_policies')
    op.drop_table('user_invitations')

