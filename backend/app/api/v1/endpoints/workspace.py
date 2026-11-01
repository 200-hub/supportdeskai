from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.db.session import get_async_db
from app.models.user import User, UserRole
from app.schemas.tenant import TenantResponse
from app.schemas.user import UserResponse, UserUpdate, WorkspaceUserCreate
from app.schemas.workflow import (
    BulkInvitationCreate,
    InvitationAcceptRequest,
    SlugAvailabilityResponse,
    UserInvitationCreate,
    UserInvitationResponse,
    WorkspaceUpdateRequest,
)
from app.services import workspace as workspace_service

router = APIRouter()


@router.get("/check-slug", response_model=SlugAvailabilityResponse)
async def check_slug(
    slug: str = Query(..., min_length=2),
    db: AsyncSession = Depends(get_async_db),
):
    is_avail = await workspace_service.check_slug_availability(db, slug)
    return SlugAvailabilityResponse(slug=slug, is_available=is_avail)


@router.get("/current", response_model=TenantResponse)
async def get_current_workspace(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    return await workspace_service.get_workspace(
        db=db,
        tenant_id=current_user.tenant_id,
    )


@router.patch("/current", response_model=TenantResponse)
async def update_current_workspace(
    data: WorkspaceUpdateRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await workspace_service.update_workspace(
        db=db,
        tenant_id=current_user.tenant_id,
        update_data=data,
    )


@router.post("/invite", response_model=List[UserInvitationResponse], status_code=status.HTTP_201_CREATED)
async def invite_user(
    invite_in: UserInvitationCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await workspace_service.invite_users(
        db=db,
        tenant_id=current_user.tenant_id,
        emails=[invite_in.email],
        role=invite_in.role,
    )


@router.post("/invite/bulk", response_model=List[UserInvitationResponse], status_code=status.HTTP_201_CREATED)
async def bulk_invite(
    bulk_in: BulkInvitationCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await workspace_service.invite_users(
        db=db,
        tenant_id=current_user.tenant_id,
        emails=bulk_in.emails,
        role=bulk_in.role,
    )


@router.post("/invitations/{token}/accept", response_model=UserResponse)
async def accept_invitation(
    token: str,
    accept_in: InvitationAcceptRequest,
    db: AsyncSession = Depends(get_async_db),
):
    return await workspace_service.accept_invitation(
        db=db,
        token=token,
        data=accept_in,
    )


# ---------------- Workspace Users Management ----------------
@router.get("/users", response_model=List[UserResponse])
async def list_workspace_users(
    role: Optional[UserRole] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await workspace_service.list_workspace_users(
        db=db,
        tenant_id=current_user.tenant_id,
        role=role,
        search=search,
    )


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace_user(
    user_in: WorkspaceUserCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_async_db),
):
    return await workspace_service.create_workspace_user(
        db=db,
        tenant_id=current_user.tenant_id,
        user_in=user_in,
    )


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_workspace_user(
    user_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await workspace_service.get_workspace_user(
        db=db,
        tenant_id=current_user.tenant_id,
        user_id=user_id,
    )


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_workspace_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await workspace_service.update_workspace_user(
        db=db,
        tenant_id=current_user.tenant_id,
        user_id=user_id,
        user_update=user_update,
        actor_role=current_user.role,
        actor_id=current_user.id,
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace_user(
    user_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_async_db),
):
    await workspace_service.delete_workspace_user(
        db=db,
        tenant_id=current_user.tenant_id,
        user_id=user_id,
        actor_role=current_user.role,
        actor_id=current_user.id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)

