from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.db.session import get_async_db
from app.models.user import User, UserRole
from app.schemas.workflow import (
    RoutingAssignResponse,
    RoutingRuleCreate,
    RoutingRuleResponse,
    RoutingRuleUpdate,
)
from app.services import routing as routing_service

router = APIRouter()


@router.post("/rules", response_model=RoutingRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_routing_rule(
    rule_in: RoutingRuleCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Create a new ticket routing rule. Restricted to Admins and Agents.
    """
    return await routing_service.create_routing_rule(
        db=db,
        tenant_id=current_user.tenant_id,
        rule_in=rule_in,
    )


@router.get("/rules", response_model=List[RoutingRuleResponse])
async def list_routing_rules(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    List all ticket routing rules in priority order.
    """
    return await routing_service.list_routing_rules(
        db=db,
        tenant_id=current_user.tenant_id,
    )


@router.get("/rules/{rule_id}", response_model=RoutingRuleResponse)
async def get_routing_rule(
    rule_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Retrieve single routing rule details.
    """
    return await routing_service.get_routing_rule(
        db=db,
        tenant_id=current_user.tenant_id,
        rule_id=rule_id,
    )


@router.patch("/rules/{rule_id}", response_model=RoutingRuleResponse)
async def update_routing_rule(
    rule_id: str,
    rule_in: RoutingRuleUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Update priority, target team, channel, or strategy of a routing rule.
    """
    return await routing_service.update_routing_rule(
        db=db,
        tenant_id=current_user.tenant_id,
        rule_id=rule_id,
        rule_in=rule_in,
    )


@router.delete("/rules/{rule_id}", response_model=RoutingRuleResponse)
async def delete_routing_rule(
    rule_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Delete a routing rule. Restricted to Admins and Agents.
    """
    return await routing_service.delete_routing_rule(
        db=db,
        tenant_id=current_user.tenant_id,
        rule_id=rule_id,
    )


@router.patch("/active-strategy", response_model=RoutingRuleResponse)
async def update_active_strategy(
    strategy: str = Query(..., description="round_robin, least_loaded, skills_based"),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Set default active assignment strategy for the workspace.
    """
    return await routing_service.set_active_routing_strategy(
        db=db,
        tenant_id=current_user.tenant_id,
        strategy=strategy,
    )


@router.post("/assign/{ticket_id}", response_model=RoutingAssignResponse)
async def assign_ticket(
    ticket_id: str,
    strategy: Optional[str] = Query(None, description="round_robin, least_loaded, skills_based"),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Auto-assign ticket to eligible agent using matching routing rules or specified strategy.
    """
    return await routing_service.auto_assign_ticket(
        db=db,
        ticket_id=ticket_id,
        tenant_id=current_user.tenant_id,
        strategy=strategy,
    )

