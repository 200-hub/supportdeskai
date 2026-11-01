from typing import Any, Dict, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_async_db
from app.models.user import User
from app.schemas.workflow import MacroCreate, MacroResponse
from app.services import macro as macro_service

router = APIRouter()


@router.post("/", response_model=MacroResponse, status_code=status.HTTP_201_CREATED)
async def create_macro(
    macro_in: MacroCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    return await macro_service.create_macro(
        db=db,
        tenant_id=current_user.tenant_id,
        macro_in=macro_in,
    )


@router.get("/", response_model=List[MacroResponse])
async def list_macros(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    return await macro_service.list_macros(
        db=db,
        tenant_id=current_user.tenant_id,
    )


@router.post("/{macro_id}/apply/{ticket_id}")
async def apply_macro(
    macro_id: str,
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    return await macro_service.apply_macro_to_ticket(
        db=db,
        macro_id=macro_id,
        ticket_id=ticket_id,
        tenant_id=current_user.tenant_id,
        current_user=current_user,
    )

