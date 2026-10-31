from typing import List
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.db.session import get_async_db
from app.models.user import User, UserRole
from app.schemas.team import TeamCreate, TeamResponse, TeamUpdate
from app.services import team as team_service

router = APIRouter()


@router.post("/", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_in: TeamCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await team_service.create_team(
        db=db,
        tenant_id=current_user.tenant_id,
        team_in=team_in,
    )


@router.get("/", response_model=List[TeamResponse])
async def list_teams(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    return await team_service.list_teams(
        db=db,
        tenant_id=current_user.tenant_id,
    )


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    return await team_service.get_team(
        db=db,
        team_id=team_id,
        tenant_id=current_user.tenant_id,
    )


@router.patch("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: str,
    team_in: TeamUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await team_service.update_team(
        db=db,
        team_id=team_id,
        tenant_id=current_user.tenant_id,
        team_in=team_in,
    )


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    await team_service.delete_team(
        db=db,
        team_id=team_id,
        tenant_id=current_user.tenant_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{team_id}/members/{user_id}", response_model=TeamResponse)
async def assign_user_to_team(
    team_id: str,
    user_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await team_service.assign_user_to_team(
        db=db,
        team_id=team_id,
        user_id=user_id,
        tenant_id=current_user.tenant_id,
    )


@router.delete("/{team_id}/members/{user_id}", response_model=TeamResponse)
async def remove_user_from_team(
    team_id: str,
    user_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await team_service.remove_user_from_team(
        db=db,
        team_id=team_id,
        user_id=user_id,
        tenant_id=current_user.tenant_id,
    )

