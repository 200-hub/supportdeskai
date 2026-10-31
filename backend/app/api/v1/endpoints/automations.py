from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_async_db
from app.models.user import User
from app.schemas.workflow import AutomationRuleCreate, AutomationRuleResponse
from app.services import automation as automation_service

router = APIRouter()


@router.post("/", response_model=AutomationRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_automation(
    rule_in: AutomationRuleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    return await automation_service.create_automation_rule(
        db=db,
        tenant_id=current_user.tenant_id,
        rule_in=rule_in,
    )


@router.get("/", response_model=List[AutomationRuleResponse])
async def list_automations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    return await automation_service.list_automation_rules(
        db=db,
        tenant_id=current_user.tenant_id,
    )


@router.post("/execute/{ticket_id}")
async def execute_automations(
    ticket_id: str,
    event_type: str = Query("ticket_created", description="ticket_created, ticket_updated"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    return await automation_service.execute_automations_for_event(
        db=db,
        tenant_id=current_user.tenant_id,
        ticket_id=ticket_id,
        event_type=event_type,
    )

