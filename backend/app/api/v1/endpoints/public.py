from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.core.rate_limit import form_submit_limiter, webchat_init_limiter
from app.db.session import get_async_db
from app.models.user import User, UserRole
from app.schemas.channel import (
    PublicFormCreate,
    PublicFormResponse,
    PublicFormSubmission,
    WebChatInitRequest,
    WebChatInitResponse,
)
from app.services import channel as channel_service

router = APIRouter()


# Authenticated form builder — protected by JWT, restricted to Admin/Agent
@router.post("/forms", response_model=PublicFormResponse, status_code=status.HTTP_201_CREATED)
async def create_public_form(
    form_in: PublicFormCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await channel_service.create_public_form(
        db=db,
        tenant_id=current_user.tenant_id,
        form_in=form_in,
    )


# Public form retrieval — read-only, low-risk
@router.get("/forms/{slug}", response_model=PublicFormResponse)
async def get_public_form(
    slug: str,
    db: AsyncSession = Depends(get_async_db),
):
    return await channel_service.get_public_form(db=db, slug=slug)


# Public form submission — unauthenticated write, rate-limited
@router.post("/forms/{slug}/submit")
async def submit_public_form(
    slug: str,
    submission: PublicFormSubmission,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
):
    """
    Submit a public intake form.  Rate-limited to 10 submissions per 60s per IP.
    """
    await form_submit_limiter.check(request)
    return await channel_service.submit_public_form(
        db=db,
        slug=slug,
        submission=submission,
    )


# Web Chat Visitor Init — unauthenticated, rate-limited
@router.post("/chat/init", response_model=WebChatInitResponse)
async def init_web_chat(
    request: Request,
    chat_request: WebChatInitRequest,
    db: AsyncSession = Depends(get_async_db),
):
    """
    Initialize a web chat visitor session.  Rate-limited to 20 inits per 60s per IP.
    """
    await webchat_init_limiter.check(request)
    return await channel_service.initialize_web_chat(
        db=db,
        request=chat_request,
    )
