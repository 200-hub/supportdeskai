from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles
from app.db.session import get_async_db
from app.models.user import User, UserRole
from app.schemas.workflow import (
    MacroApplyResponse,
    MacroCreate,
    MacroResponse,
    MacroUpdate,
)
from app.services import macro as macro_service

router = APIRouter()


@router.post("/", response_model=MacroResponse, status_code=status.HTTP_201_CREATED)
async def create_macro(
    macro_in: MacroCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await macro_service.create_macro(
        db=db,
        tenant_id=current_user.tenant_id,
        macro_in=macro_in,
    )


@router.get("/", response_model=List[MacroResponse])
async def list_macros(
    include_inactive: bool = Query(True, description="Whether to include inactive macros"),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await macro_service.list_macros(
        db=db,
        tenant_id=current_user.tenant_id,
        include_inactive=include_inactive,
    )


@router.get("/{macro_id}", response_model=MacroResponse)
async def get_macro(
    macro_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await macro_service.get_macro(
        db=db,
        macro_id=macro_id,
        tenant_id=current_user.tenant_id,
    )


@router.patch("/{macro_id}", response_model=MacroResponse)
async def update_macro(
    macro_id: str,
    macro_in: MacroUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await macro_service.update_macro(
        db=db,
        macro_id=macro_id,
        tenant_id=current_user.tenant_id,
        macro_in=macro_in,
    )


@router.delete("/{macro_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_macro(
    macro_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    await macro_service.delete_macro(
        db=db,
        macro_id=macro_id,
        tenant_id=current_user.tenant_id,
    )
    return None


@router.post("/{macro_id}/apply/{ticket_id}", response_model=MacroApplyResponse)
async def apply_macro(
    macro_id: str,
    ticket_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await macro_service.apply_macro_to_ticket(
        db=db,
        macro_id=macro_id,
        ticket_id=ticket_id,
        tenant_id=current_user.tenant_id,
        current_user=current_user,
    )
