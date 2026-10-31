from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.team import Team
from app.models.user import User
from app.schemas.team import TeamCreate, TeamUpdate


async def create_team(
    db: AsyncSession,
    tenant_id: str,
    team_in: TeamCreate,
) -> Team:
    team = Team(
        tenant_id=tenant_id,
        name=team_in.name.strip(),
        description=team_in.description,
    )
    db.add(team)
    await db.commit()
    return await get_team(db, team.id, tenant_id)


async def list_teams(
    db: AsyncSession,
    tenant_id: str,
) -> List[Team]:
    query = (
        select(Team)
        .where(Team.tenant_id == tenant_id)
        .options(selectinload(Team.members))
        .order_by(Team.name.asc())
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_team(
    db: AsyncSession,
    team_id: str,
    tenant_id: str,
) -> Team:
    query = (
        select(Team)
        .where(Team.id == team_id, Team.tenant_id == tenant_id)
        .options(selectinload(Team.members))
    )
    result = await db.execute(query)
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team '{team_id}' not found"
        )
    return team


async def update_team(
    db: AsyncSession,
    team_id: str,
    tenant_id: str,
    team_in: TeamUpdate,
) -> Team:
    team = await get_team(db, team_id, tenant_id)
    if team_in.name is not None:
        stripped_name = team_in.name.strip()
        if len(stripped_name) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Team name must be at least 2 characters",
            )
        team.name = stripped_name
    if team_in.description is not None:
        team.description = team_in.description
    await db.commit()
    return await get_team(db, team_id, tenant_id)


async def delete_team(
    db: AsyncSession,
    team_id: str,
    tenant_id: str,
) -> None:
    team = await get_team(db, team_id, tenant_id)
    users_res = await db.execute(
        select(User).where(User.team_id == team.id, User.tenant_id == tenant_id)
    )
    for u in users_res.scalars().all():
        u.team_id = None
    await db.delete(team)
    await db.commit()


async def assign_user_to_team(
    db: AsyncSession,
    team_id: str,
    user_id: str,
    tenant_id: str,
) -> Team:
    team = await get_team(db, team_id, tenant_id)
    user_res = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == tenant_id)
    )
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{user_id}' not found in this workspace"
        )
    user.team_id = team.id
    await db.commit()
    return await get_team(db, team_id, tenant_id)


async def remove_user_from_team(
    db: AsyncSession,
    team_id: str,
    user_id: str,
    tenant_id: str,
) -> Team:
    team = await get_team(db, team_id, tenant_id)
    user_res = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == tenant_id)
    )
    user = user_res.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{user_id}' not found in this workspace",
        )
    if user.team_id == team.id:
        user.team_id = None
        await db.commit()
    return await get_team(db, team_id, tenant_id)

