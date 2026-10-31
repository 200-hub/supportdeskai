from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.rate_limit import login_limiter, password_reset_limiter, register_limiter
from app.db.session import get_async_db
from app.models.user import User
from app.schemas.user import (
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services import auth as auth_service

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
):
    """
    Register a new user account (Customer, Agent, or Admin) and receive JWT access + refresh token.
    Rate-limited to 5 registrations per 60s per IP.
    """
    await register_limiter.check(request)
    return await auth_service.register_user(db, user_data)


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: UserLogin,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
):
    """
    Authenticate with email and password to receive JWT access + refresh token.
    Rate-limited to 10 attempts per 60s per IP.
    """
    await login_limiter.check(request)
    return await auth_service.authenticate_user(db, login_data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_async_db),
):
    """
    Rotate expired or expiring access token using a valid refresh token.
    Not rate-limited (the refresh token itself is the credential).
    """
    return await auth_service.rotate_refresh_token(db, refresh_data)


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve profile of the currently authenticated user.
    """
    return current_user


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Revoke all active refresh tokens and terminate session.
    """
    await auth_service.revoke_all_user_tokens(db, current_user.id)
    return {"message": "Logged out successfully", "user_id": current_user.id}


@router.post("/password-reset/request")
async def request_password_reset(
    req: PasswordResetRequest,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
):
    """
    Request password reset instructions.
    Rate-limited to 5 requests per 300s per IP to prevent email flooding.
    """
    await password_reset_limiter.check(request)
    return await auth_service.request_password_reset(db, req)


@router.post("/password-reset/confirm")
async def confirm_password_reset(
    req: PasswordResetConfirm,
    db: AsyncSession = Depends(get_async_db),
):
    """
    Confirm password reset with signed reset token and set new password.
    Not rate-limited separately (the signed token is the credential).
    """
    return await auth_service.confirm_password_reset(db, req)
