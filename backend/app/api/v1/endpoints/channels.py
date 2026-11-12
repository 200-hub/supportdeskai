import json
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.core.rate_limit import webhook_limiter
from app.core.webhook_security import verify_email_signature, verify_whatsapp_signature
from app.core.config import settings
from app.db.session import get_async_db
from app.models.user import User, UserRole
from app.schemas.channel import ChannelCreate, ChannelResponse, ChannelUpdate
from app.services import channel as channel_service

router = APIRouter()


@router.post("/", response_model=ChannelResponse, status_code=status.HTTP_201_CREATED)
async def create_channel(
    channel_in: ChannelCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await channel_service.create_channel(
        db=db,
        tenant_id=current_user.tenant_id,
        channel_in=channel_in,
    )


@router.get("/", response_model=List[ChannelResponse])
async def list_channels(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    return await channel_service.list_channels(
        db=db,
        tenant_id=current_user.tenant_id,
    )


@router.get("/{channel_id}", response_model=ChannelResponse)
async def get_channel(
    channel_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    return await channel_service.get_channel(
        db=db,
        channel_id=channel_id,
        tenant_id=current_user.tenant_id,
    )


@router.patch("/{channel_id}", response_model=ChannelResponse)
async def update_channel(
    channel_id: str,
    channel_in: ChannelUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await channel_service.update_channel(
        db=db,
        channel_id=channel_id,
        tenant_id=current_user.tenant_id,
        channel_in=channel_in,
    )


@router.delete("/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_channel(
    channel_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    await channel_service.delete_channel(
        db=db,
        channel_id=channel_id,
        tenant_id=current_user.tenant_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# WhatsApp Cloud API
# ---------------------------------------------------------------------------

@router.get("/webhook/whatsapp/{tenant_slug}")
async def whatsapp_hub_challenge(
    tenant_slug: str,
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
):
    """
    WhatsApp Cloud API webhook verification handshake (GET).

    Meta sends this GET request when you register or update the webhook URL
    in the Meta Developer Console. The endpoint must echo back ``hub.challenge``
    when the ``hub.verify_token`` matches the configured secret.

    Environment variable
    --------------------
    ``WHATSAPP_WEBHOOK_SECRET`` — must match the Verify Token you entered in
    the Meta Developer Console.
    """
    from fastapi import HTTPException
    from fastapi.responses import PlainTextResponse

    expected_token = settings.WHATSAPP_WEBHOOK_SECRET
    if not expected_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="WhatsApp webhook verify token is not configured on this server.",
        )

    if hub_mode != "subscribe" or hub_verify_token != expected_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="WhatsApp hub verification failed: invalid mode or verify token.",
        )

    return PlainTextResponse(content=hub_challenge or "", status_code=200)


@router.post("/webhook/whatsapp/{tenant_slug}")
async def whatsapp_inbound_webhook(
    tenant_slug: str,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
):
    """
    Public inbound WhatsApp Cloud API webhook endpoint (POST).

    Security
    --------
    * Verifies ``X-Hub-Signature-256`` HMAC-SHA256 against ``WHATSAPP_WEBHOOK_SECRET``.
    * Rate-limited to 200 requests/min per source IP.
    * In production, rejects requests when the secret is not configured (HTTP 503).
    * In development/testing, skips verification when the secret is absent.
    """
    await webhook_limiter.check(request)
    raw_body = await verify_whatsapp_signature(request)

    try:
        payload: Dict[str, Any] = json.loads(raw_body)
    except (ValueError, UnicodeDecodeError):
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed JSON in WhatsApp webhook payload",
        )

    return await channel_service.handle_whatsapp_webhook(
        db=db,
        tenant_slug=tenant_slug,
        payload=payload,
    )


# ---------------------------------------------------------------------------
# Email webhooks (SendGrid / Mailgun / AWS SES)
# ---------------------------------------------------------------------------

@router.post("/webhook/email/{tenant_slug}")
async def email_inbound_webhook(
    tenant_slug: str,
    request: Request,
    db: AsyncSession = Depends(get_async_db),
):
    """
    Public inbound email provider webhook endpoint (POST).

    Supports
    --------
    * **Mailgun**: Verifies ``timestamp`` + ``token`` + ``signature`` triple
      in JSON body using HMAC-SHA256 with ``EMAIL_WEBHOOK_SECRET``.
    * **Generic fallback**: Verifies ``X-Webhook-Signature`` header with the
      same HMAC-SHA256 key.

    Security
    --------
    * Rate-limited to 200 requests/min per source IP.
    * In production, rejects requests when the secret is not configured (HTTP 503).
    * In development/testing, skips verification when the secret is absent.
    """
    await webhook_limiter.check(request)
    raw_body = await verify_email_signature(request)

    try:
        payload: Dict[str, Any] = json.loads(raw_body)
    except (ValueError, UnicodeDecodeError):
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed JSON in email webhook payload",
        )

    return await channel_service.handle_inbound_email_webhook(
        db=db,
        tenant_slug=tenant_slug,
        payload=payload,
    )
