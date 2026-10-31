import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.team import Team
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from app.models.workspace import UserInvitation
from app.schemas.user import UserUpdate, WorkspaceUserCreate
from app.schemas.workflow import InvitationAcceptRequest, WorkspaceUpdateRequest


async def check_slug_availability(db: AsyncSession, slug: str) -> bool:
    slug_clean = slug.lower().strip()
    res = await db.execute(select(Tenant).where(Tenant.slug == slug_clean))
    return res.scalar_one_or_none() is None


async def get_workspace(db: AsyncSession, tenant_id: str) -> Tenant:
    res = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = res.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return tenant


async def update_workspace(
    db: AsyncSession,
    tenant_id: str,
    update_data: WorkspaceUpdateRequest,
) -> Tenant:
    import json

    res = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = res.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    if update_data.name:
        tenant.name = update_data.name
    if update_data.plan:
        tenant.plan = update_data.plan

    # Persist additional workspace settings into settings_json
    if update_data.business_hours or update_data.branding_color:
        try:
            curr_settings = json.loads(tenant.settings_json or "{}")
        except Exception:
            curr_settings = {}
        if update_data.business_hours:
            curr_settings["business_hours"] = update_data.business_hours
        if update_data.branding_color:
            curr_settings["branding_color"] = update_data.branding_color
        tenant.settings_json = json.dumps(curr_settings)

    await db.commit()
    await db.refresh(tenant)
    return tenant


async def invite_users(
    db: AsyncSession,
    tenant_id: str,
    emails: List[str],
    role: str = "agent",
) -> List[UserInvitation]:
    invitations = []
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    for email in emails:
        clean_email = email.lower().strip()
        token = secrets.token_urlsafe(32)
        invitation = UserInvitation(
            tenant_id=tenant_id,
            email=clean_email,
            role=role,
            invitation_token=token,
            is_accepted=False,
            expires_at=expires_at,
        )
        db.add(invitation)
        invitations.append(invitation)

    await db.commit()
    for inv in invitations:
        await db.refresh(inv)
    return invitations


async def accept_invitation(
    db: AsyncSession,
    token: str,
    data: InvitationAcceptRequest,
) -> User:
    res = await db.execute(select(UserInvitation).where(UserInvitation.invitation_token == token))
    inv = res.scalar_one_or_none()
    if not inv or inv.is_accepted or inv.is_expired:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation token is invalid, already accepted, or expired"
        )

    # Check if user already exists
    existing = await db.execute(
        select(User).where(User.tenant_id == inv.tenant_id, User.email == inv.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists in this workspace"
        )

    # Create new user
    initials = "".join(part[0].upper() for part in data.name.strip().split()[:2]) or "SD"
    user_role = getattr(UserRole, inv.role.upper(), UserRole.AGENT)

    user = User(
        tenant_id=inv.tenant_id,
        email=inv.email,
        hashed_password=hash_password(data.password),
        name=data.name.strip(),
        role=user_role,
        avatar_initials=initials,
        is_active=True,
    )
    db.add(user)
    inv.is_accepted = True
    await db.commit()
    await db.refresh(user)
    return user


async def list_workspace_users(
    db: AsyncSession,
    tenant_id: str,
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
) -> List[User]:
    query = select(User).where(User.tenant_id == tenant_id)
    if role:
        query = query.where(User.role == role)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                User.name.ilike(pattern),
                User.email.ilike(pattern),
            )
        )
    result = await db.execute(query.order_by(User.name.asc()))
    return list(result.scalars().all())


async def get_workspace_user(
    db: AsyncSession,
    tenant_id: str,
    user_id: str,
) -> User:
    res = await db.execute(select(User).where(User.id == user_id, User.tenant_id == tenant_id))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{user_id}' not found in this workspace",
        )
    return user


async def create_workspace_user(
    db: AsyncSession,
    tenant_id: str,
    user_in: WorkspaceUserCreate,
) -> User:
    clean_email = user_in.email.lower().strip()
    existing = await db.execute(
        select(User).where(User.tenant_id == tenant_id, User.email == clean_email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{clean_email}' already exists in this workspace",
        )

    if user_in.team_id:
        team_check = await db.execute(
            select(Team).where(Team.id == user_in.team_id, Team.tenant_id == tenant_id)
        )
        if not team_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Specified team not found in this workspace",
            )

    initials = "".join(part[0].upper() for part in user_in.name.strip().split()[:2]) or "SD"
    user = User(
        tenant_id=tenant_id,
        email=clean_email,
        hashed_password=hash_password(user_in.password),
        name=user_in.name.strip(),
        role=user_in.role,
        phone=user_in.phone,
        company=user_in.company,
        team_id=user_in.team_id,
        avatar_initials=initials,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update_workspace_user(
    db: AsyncSession,
    tenant_id: str,
    user_id: str,
    user_update: UserUpdate,
    actor_role: UserRole,
    actor_id: str,
) -> User:
    user = await get_workspace_user(db, tenant_id, user_id)

    if user_update.role is not None:
        if actor_role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can change user roles",
            )
        if user.id == actor_id and user_update.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Administrators cannot demote themselves",
            )
        user.role = user_update.role

    if user_update.is_active is not None:
        if actor_role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can activate/deactivate accounts",
            )
        if user.id == actor_id and not user_update.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate your own account",
            )
        user.is_active = user_update.is_active

    if user_update.name is not None:
        stripped_name = user_update.name.strip()
        if len(stripped_name) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="User name must be at least 2 characters",
            )
        user.name = stripped_name
        user.avatar_initials = "".join(part[0].upper() for part in stripped_name.split()[:2]) or "SD"

    if user_update.phone is not None:
        user.phone = user_update.phone
    if user_update.company is not None:
        user.company = user_update.company

    if user_update.team_id is not None:
        if user_update.team_id == "":
            user.team_id = None
        else:
            team_res = await db.execute(
                select(Team).where(Team.id == user_update.team_id, Team.tenant_id == tenant_id)
            )
            if not team_res.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Specified team not found in this workspace",
                )
            user.team_id = user_update.team_id

    await db.commit()
    await db.refresh(user)
    return user


async def delete_workspace_user(
    db: AsyncSession,
    tenant_id: str,
    user_id: str,
    actor_role: UserRole,
    actor_id: str,
) -> None:
    if actor_role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete workspace users",
        )
    if user_id == actor_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )
    user = await get_workspace_user(db, tenant_id, user_id)
    await db.delete(user)
    await db.commit()

