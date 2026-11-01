from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles
from app.db.session import get_async_db
from app.models.user import User, UserRole
from app.schemas.workflow import (
    AutomationExecutionResponse,
    AutomationLogResponse,
    AutomationRuleCreate,
    AutomationRuleResponse,
    AutomationRuleUpdate,
)
from app.services import automation as automation_service

router = APIRouter()


@router.post("/", response_model=AutomationRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_automation(
    rule_in: AutomationRuleCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await automation_service.create_automation_rule(
        db=db,
        tenant_id=current_user.tenant_id,
        rule_in=rule_in,
    )


@router.get("/", response_model=List[AutomationRuleResponse])
async def list_automations(
    trigger_event: Optional[str] = Query(None, description="Filter by trigger event"),
    include_inactive: bool = Query(True, description="Whether to include inactive rules"),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await automation_service.list_automation_rules(
        db=db,
        tenant_id=current_user.tenant_id,
        trigger_event=trigger_event,
        include_inactive=include_inactive,
    )


@router.get("/logs", response_model=List[AutomationLogResponse])
async def get_automation_logs(
    rule_id: Optional[str] = Query(None, description="Filter by rule ID"),
    ticket_id: Optional[str] = Query(None, description="Filter by ticket ID"),
    limit: int = Query(50, ge=1, le=200, description="Max logs to return"),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await automation_service.list_automation_logs(
        db=db,
        tenant_id=current_user.tenant_id,
        rule_id=rule_id,
        ticket_id=ticket_id,
        limit=limit,
    )


@router.get("/{rule_id}", response_model=AutomationRuleResponse)
async def get_automation(
    rule_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await automation_service.get_automation_rule(
        db=db,
        rule_id=rule_id,
        tenant_id=current_user.tenant_id,
    )


@router.patch("/{rule_id}", response_model=AutomationRuleResponse)
async def update_automation(
    rule_id: str,
    rule_in: AutomationRuleUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await automation_service.update_automation_rule(
        db=db,
        rule_id=rule_id,
        tenant_id=current_user.tenant_id,
        rule_in=rule_in,
    )


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_automation(
    rule_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    await automation_service.delete_automation_rule(
        db=db,
        rule_id=rule_id,
        tenant_id=current_user.tenant_id,
    )
    return None


@router.post("/execute/{ticket_id}", response_model=List[AutomationExecutionResponse])
async def execute_automations(
    ticket_id: str,
    event_type: str = Query("ticket_created", description="ticket_created, ticket_updated, status_changed, priority_changed"),
    depth: int = Query(0, ge=0, description="Execution recursion depth"),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await automation_service.execute_automations_for_event(
        db=db,
        tenant_id=current_user.tenant_id,
        ticket_id=ticket_id,
        event_type=event_type,
        depth=depth,
    )
