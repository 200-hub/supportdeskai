from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.db.session import get_async_db
from app.models.user import User, UserRole
from app.schemas.workflow import (
    SLAEvaluationResponse,
    SLAPolicyCreate,
    SLAPolicyResponse,
    SLAPolicyUpdate,
)
from app.services import sla as sla_service
from app.services import ticket as ticket_service

router = APIRouter()


@router.post("/policies", response_model=SLAPolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_sla_policy(
    policy_in: SLAPolicyCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Create a new SLA policy target. Restricted to Admins and Agents.
    """
    return await sla_service.create_sla_policy(
        db=db,
        tenant_id=current_user.tenant_id,
        policy_in=policy_in,
    )


@router.get("/policies", response_model=List[SLAPolicyResponse])
async def list_sla_policies(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    List all SLA policies configured for the tenant.
    """
    return await sla_service.list_sla_policies(
        db=db,
        tenant_id=current_user.tenant_id,
    )


@router.get("/policies/{policy_id}", response_model=SLAPolicyResponse)
async def get_sla_policy(
    policy_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Retrieve single SLA policy details.
    """
    return await sla_service.get_sla_policy(
        db=db,
        tenant_id=current_user.tenant_id,
        policy_id=policy_id,
    )


@router.patch("/policies/{policy_id}", response_model=SLAPolicyResponse)
async def update_sla_policy(
    policy_id: str,
    policy_in: SLAPolicyUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Update target times or settings of an existing SLA policy.
    """
    return await sla_service.update_sla_policy(
        db=db,
        tenant_id=current_user.tenant_id,
        policy_id=policy_id,
        policy_in=policy_in,
    )


@router.delete("/policies/{policy_id}", response_model=SLAPolicyResponse)
async def delete_sla_policy(
    policy_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Delete an SLA policy. Restricted to Admins and Agents.
    """
    return await sla_service.delete_sla_policy(
        db=db,
        tenant_id=current_user.tenant_id,
        policy_id=policy_id,
    )


@router.post("/evaluate/{ticket_id}", response_model=SLAEvaluationResponse)
async def evaluate_sla(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Evaluate SLA status and remaining time for a ticket. Customers may only evaluate their own tickets.
    """
    # Enforces tenant isolation and customer ownership
    await ticket_service.get_ticket(
        db=db,
        ticket_id=ticket_id,
        tenant_id=current_user.tenant_id,
        current_user=current_user,
    )
    return await sla_service.evaluate_ticket_sla(
        db=db,
        ticket_id=ticket_id,
        tenant_id=current_user.tenant_id,
    )

