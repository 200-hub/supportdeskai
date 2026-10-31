import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    DUMMY_PASSWORD_HASH,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.auth_session import RefreshToken
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from app.schemas.user import (
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)


def extract_initials(name: str) -> str:
    """Helper to generate avatar initials (e.g. 'Sarah Connor' -> 'SC')"""
    parts = name.strip().split()
    if not parts:
        return "SD"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


async def get_or_create_tenant(
    db: AsyncSession,
    slug: str = "default-tenant",
    name: str = "Acme Global Technologies Inc."
) -> Tenant:
    """
    Find existing tenant by unique slug or create a new default tenant.
    """
    result = await db.execute(select(Tenant).where(Tenant.slug == slug))
    tenant = result.scalar_one_or_none()
    if not tenant:
        tenant = Tenant(
            name=name,
            slug=slug,
            plan="Enterprise Omnichannel SaaS",
            is_active=True,
            settings_json="{}"
        )
        db.add(tenant)
        await db.commit()
        await db.refresh(tenant)
    return tenant


async def issue_refresh_token(db: AsyncSession, user_id: str) -> str:
    raw_token = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)

    record = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
        is_revoked=False,
    )
    db.add(record)
    await db.commit()
    return raw_token


async def register_user(db: AsyncSession, user_data: UserCreate) -> TokenResponse:
    """
    Register a new user within a tenant workspace and issue access + refresh token.
    """
    tenant_slug = user_data.tenant_slug or "default-tenant"
    tenant = await get_or_create_tenant(db, slug=tenant_slug)

    # Check email uniqueness within tenant
    existing_user = await db.execute(
        select(User).where(
            User.tenant_id == tenant.id,
            User.email == user_data.email.lower().strip()
        )
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists in this workspace"
        )

    hashed_pw = hash_password(user_data.password)
    initials = extract_initials(user_data.name)

    user = User(
        tenant_id=tenant.id,
        email=user_data.email.lower().strip(),
        hashed_password=hashed_pw,
        name=user_data.name.strip(),
        role=user_data.role or UserRole.CUSTOMER,
        phone=user_data.phone,
        company=user_data.company,
        avatar_initials=initials,
        is_active=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(
        subject=user.id,
        claims={
            "tenant_id": user.tenant_id,
            "role": user.role.value,
            "email": user.email
        }
    )
    refresh_tok = await issue_refresh_token(db, user.id)

    return TokenResponse(
        access_token=token,
        refresh_token=refresh_tok,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


def _is_production() -> bool:
    env = settings.ENVIRONMENT.lower()
    return env not in ("development", "testing", "dev", "test")


async def authenticate_user(db: AsyncSession, login_data: UserLogin) -> TokenResponse:
    """
    Authenticate user credentials, enforce password verification, and issue access + refresh token.
    Uses constant-time dummy verification when user is not found to prevent user enumeration.
    """
    email_clean = login_data.email.lower().strip()

    query = select(User).where(User.email == email_clean)
    if login_data.tenant_slug:
        result_tenant = await db.execute(select(Tenant).where(Tenant.slug == login_data.tenant_slug))
        tenant = result_tenant.scalar_one_or_none()
        if not tenant:
            # Timing attack mitigation: always execute password verification
            verify_password(login_data.password, DUMMY_PASSWORD_HASH)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid workspace or credentials"
            )
        query = query.where(User.tenant_id == tenant.id)

    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        # Timing attack mitigation: always execute password verification
        verify_password(login_data.password, DUMMY_PASSWORD_HASH)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is currently inactive. Contact your administrator."
        )

    # Role check if requested
    if login_data.role and user.role != login_data.role:
        if not (user.role == UserRole.ADMIN and login_data.role == UserRole.AGENT):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User does not have required {login_data.role.value} privileges"
            )

    token = create_access_token(
        subject=user.id,
        claims={
            "tenant_id": user.tenant_id,
            "role": user.role.value,
            "email": user.email
        }
    )
    refresh_tok = await issue_refresh_token(db, user.id)

    return TokenResponse(
        access_token=token,
        refresh_token=refresh_tok,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


async def rotate_refresh_token(db: AsyncSession, req: RefreshTokenRequest) -> TokenResponse:
    """
    Validate refresh token, revoke it, and issue a rotated access + refresh token pair.
    """
    token_hash = hashlib.sha256(req.refresh_token.encode("utf-8")).hexdigest()
    res = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    record = res.scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid, expired, or revoked"
        )

    if record.is_revoked:
        # Token reuse detected! Invalidate all refresh tokens for this user session family
        await revoke_all_user_tokens(db, record.user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid, expired, or revoked"
        )

    if record.is_expired:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is invalid, expired, or revoked"
        )

    # Invalidate current token
    record.is_revoked = True

    # Find user
    user_res = await db.execute(select(User).where(User.id == record.user_id))
    user = user_res.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not active")

    new_access_token = create_access_token(
        subject=user.id,
        claims={
            "tenant_id": user.tenant_id,
            "role": user.role.value,
            "email": user.email
        }
    )
    new_refresh_tok = await issue_refresh_token(db, user.id)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_tok,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


async def revoke_all_user_tokens(db: AsyncSession, user_id: str):
    res = await db.execute(select(RefreshToken).where(RefreshToken.user_id == user_id))
    for r in res.scalars().all():
        r.is_revoked = True
    await db.commit()


async def request_password_reset(db: AsyncSession, req: PasswordResetRequest) -> Dict[str, str]:
    email_clean = req.email.lower().strip()
    query = select(User).where(User.email == email_clean)

    # Multi-tenant isolation: scope reset request by tenant_slug if provided
    if req.tenant_slug:
        result_tenant = await db.execute(select(Tenant).where(Tenant.slug == req.tenant_slug))
        tenant = result_tenant.scalar_one_or_none()
        if tenant:
            query = query.where(User.tenant_id == tenant.id)
        else:
            # Unknown workspace: constant timing mitigation, generic response
            verify_password("dummy", DUMMY_PASSWORD_HASH)
            return {"message": "If an account with that email exists, reset instructions have been dispatched."}

    res = await db.execute(query)
    user = res.scalars().first()
    if not user:
        # Don't leak user existence; constant timing mitigation
        verify_password("dummy", DUMMY_PASSWORD_HASH)
        return {"message": "If an account with that email exists, reset instructions have been dispatched."}

    pwd_fingerprint = hashlib.sha256(user.hashed_password.encode("utf-8")).hexdigest()[:16]
    reset_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(hours=2),
        claims={
            "purpose": "password_reset",
            "tenant_id": user.tenant_id,
            "email": user.email,
            "pwd_fp": pwd_fingerprint
        }
    )

    # In production, reset instructions and tokens are delivered exclusively via email.
    # In development/testing, the reset token is returned in the response for test automation.
    if _is_production():
        return {"message": "If an account with that email exists, reset instructions have been dispatched."}

    return {
        "message": "If an account with that email exists, reset instructions have been dispatched.",
        "reset_token": reset_token,
    }


async def confirm_password_reset(db: AsyncSession, req: PasswordResetConfirm) -> Dict[str, str]:
    payload = decode_access_token(req.token)
    if not payload or payload.get("purpose") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token is invalid or expired"
        )

    user_id = payload.get("sub")
    tenant_id = payload.get("tenant_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token is invalid or expired"
        )

    query = select(User).where(User.id == user_id)
    if tenant_id:
        query = query.where(User.tenant_id == tenant_id)

    res = await db.execute(query)
    user = res.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or account is inactive"
        )

    # Enforce single-use via password hash fingerprint
    token_pwd_fp = payload.get("pwd_fp")
    current_pwd_fp = hashlib.sha256(user.hashed_password.encode("utf-8")).hexdigest()[:16]
    if token_pwd_fp != current_pwd_fp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token has already been used or is invalid"
        )

    user.hashed_password = hash_password(req.new_password)
    # Revoke existing sessions
    await revoke_all_user_tokens(db, user.id)
    await db.commit()
    return {"message": "Password updated successfully. Please sign in with your new credentials."}
