import json
import uuid
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.channel import Channel, ChannelType, PublicForm, WebChatVisitorSession
from app.models.crm import Contact
from app.models.tenant import Tenant
from app.models.ticket import (
    Ticket,
    TicketChannel,
    TicketMessage,
    TicketPriority,
    TicketStatus,
    TicketTimeline,
    MessageSenderType,
)
from app.schemas.channel import (
    ChannelCreate,
    ChannelUpdate,
    PublicFormCreate,
    PublicFormSubmission,
    WebChatInitRequest,
    WebChatInitResponse,
)


SENSITIVE_KEYS = {
    "secret", "api_key", "apikey", "auth_token", "token",
    "webhook_secret", "password", "private_key", "client_secret"
}


def mask_config_secrets(config_str: Optional[str]) -> str:
    """Mask sensitive configuration keys in JSON string before returning in API response."""
    if not config_str:
        return "{}"
    try:
        data = json.loads(config_str)
        if not isinstance(data, dict):
            return config_str

        def _mask_dict(d: dict) -> dict:
            masked = {}
            for k, v in d.items():
                if isinstance(v, dict):
                    masked[k] = _mask_dict(v)
                elif isinstance(k, str) and any(s in k.lower() for s in SENSITIVE_KEYS):
                    if isinstance(v, str) and len(v) > 4:
                        masked[k] = f"***{v[-4:]}"
                    else:
                        masked[k] = "********"
                else:
                    masked[k] = v
            return masked

        return json.dumps(_mask_dict(data))
    except Exception:
        return "{}"


def merge_channel_config(existing_json_str: Optional[str], new_json_str: Optional[str]) -> str:
    """Merge new config into existing config, preserving existing unmasked values if mask passed."""
    if not new_json_str:
        return existing_json_str or "{}"
    try:
        new_data = json.loads(new_json_str)
        if not isinstance(new_data, dict):
            raise ValueError()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Channel config_json must be a valid JSON object string",
        )

    try:
        existing_data = json.loads(existing_json_str or "{}")
        if not isinstance(existing_data, dict):
            existing_data = {}
    except Exception:
        existing_data = {}

    def _merge_dict(existing: dict, incoming: dict) -> dict:
        result = dict(existing)
        for k, v in incoming.items():
            if isinstance(v, dict) and isinstance(result.get(k), dict):
                result[k] = _merge_dict(result[k], v)
            elif isinstance(v, str) and (v == "********" or v.startswith("***")):
                if k not in result:
                    result[k] = v
            else:
                result[k] = v
        return result

    merged = _merge_dict(existing_data, new_data)
    return json.dumps(merged)


# ---------------- Channels ----------------
async def create_channel(
    db: AsyncSession,
    tenant_id: str,
    channel_in: ChannelCreate,
) -> Channel:
    stripped_name = channel_in.name.strip()
    if len(stripped_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Channel name must be at least 2 characters",
        )

    config_str = channel_in.config_json or "{}"
    try:
        parsed = json.loads(config_str)
        if not isinstance(parsed, dict):
            raise ValueError()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Channel config_json must be a valid JSON object string",
        )

    channel = Channel(
        tenant_id=tenant_id,
        type=channel_in.type,
        name=stripped_name,
        is_active=channel_in.is_active,
        config_json=config_str,
    )
    db.add(channel)
    await db.commit()
    await db.refresh(channel)
    channel.config_json = mask_config_secrets(channel.config_json)
    return channel


async def list_channels(
    db: AsyncSession,
    tenant_id: str,
) -> List[Channel]:
    result = await db.execute(
        select(Channel).where(Channel.tenant_id == tenant_id).order_by(Channel.created_at.asc())
    )
    channels = list(result.scalars().all())
    for c in channels:
        c.config_json = mask_config_secrets(c.config_json)
    return channels


async def get_channel(
    db: AsyncSession,
    channel_id: str,
    tenant_id: str,
) -> Channel:
    result = await db.execute(
        select(Channel).where(Channel.id == channel_id, Channel.tenant_id == tenant_id)
    )
    channel = result.scalar_one_or_none()
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Channel '{channel_id}' not found",
        )
    channel.config_json = mask_config_secrets(channel.config_json)
    return channel


async def update_channel(
    db: AsyncSession,
    channel_id: str,
    tenant_id: str,
    channel_in: ChannelUpdate,
) -> Channel:
    result = await db.execute(
        select(Channel).where(Channel.id == channel_id, Channel.tenant_id == tenant_id)
    )
    channel = result.scalar_one_or_none()
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Channel '{channel_id}' not found",
        )

    if channel_in.name is not None:
        stripped_name = channel_in.name.strip()
        if len(stripped_name) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Channel name must be at least 2 characters",
            )
        channel.name = stripped_name

    if channel_in.is_active is not None:
        channel.is_active = channel_in.is_active

    if channel_in.config_json is not None:
        channel.config_json = merge_channel_config(channel.config_json, channel_in.config_json)

    await db.commit()
    await db.refresh(channel)
    channel.config_json = mask_config_secrets(channel.config_json)
    return channel


async def delete_channel(
    db: AsyncSession,
    channel_id: str,
    tenant_id: str,
) -> None:
    result = await db.execute(
        select(Channel).where(Channel.id == channel_id, Channel.tenant_id == tenant_id)
    )
    channel = result.scalar_one_or_none()
    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Channel '{channel_id}' not found",
        )
    await db.delete(channel)
    await db.commit()


# ---------------- Forms ----------------
async def create_public_form(
    db: AsyncSession,
    tenant_id: str,
    form_in: PublicFormCreate,
) -> PublicForm:
    # Slug uniqueness check
    existing = await db.execute(select(PublicForm).where(PublicForm.slug == form_in.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Form slug '{form_in.slug}' is already in use"
        )
    form = PublicForm(
        tenant_id=tenant_id,
        slug=form_in.slug.lower().strip(),
        title=form_in.title.strip(),
        description=form_in.description,
        fields_schema_json=form_in.fields_schema_json or "[]",
        is_active=form_in.is_active,
    )
    db.add(form)
    await db.commit()
    await db.refresh(form)
    return form


async def get_public_form(
    db: AsyncSession,
    slug: str,
) -> PublicForm:
    res = await db.execute(select(PublicForm).where(PublicForm.slug == slug.lower().strip()))
    form = res.scalar_one_or_none()
    if not form or not form.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public form not found or inactive"
        )
    return form


async def submit_public_form(
    db: AsyncSession,
    slug: str,
    submission: PublicFormSubmission,
) -> Dict[str, Any]:
    form = await get_public_form(db, slug)

    # 1. Find or create Contact
    res_contact = await db.execute(
        select(Contact).where(
            Contact.tenant_id == form.tenant_id,
            Contact.email == submission.email.lower().strip(),
        )
    )
    contact = res_contact.scalar_one_or_none()
    if not contact:
        contact = Contact(
            tenant_id=form.tenant_id,
            name=submission.name.strip(),
            email=submission.email.lower().strip(),
            avatar_initials=(submission.name[:2]).upper(),
        )
        db.add(contact)
        await db.flush()

    # 2. Create Ticket from Form submission
    ticket_id = f"SD-{uuid.uuid4().hex[:4].upper()}"
    ticket = Ticket(
        id=ticket_id,
        tenant_id=form.tenant_id,
        subject=submission.subject.strip(),
        description=submission.message.strip(),
        category=submission.category or "Web Form Intake",
        channel=TicketChannel.WEB,
        status=TicketStatus.OPEN,
        priority=TicketPriority.MEDIUM,
        sla_remaining="4h",
        sla_status="safe",
        ai_confidence="90%",
    )
    db.add(ticket)
    await db.flush()

    # 3. Add initial message & audit event
    first_msg = TicketMessage(
        ticket_id=ticket.id,
        sender_type=MessageSenderType.CUSTOMER,
        sender_name=submission.name.strip(),
        content=submission.message.strip(),
    )
    db.add(first_msg)

    timeline_entry = TicketTimeline(
        ticket_id=ticket.id,
        title=f"Intake via public form '{form.title}'",
        by=submission.name.strip(),
    )
    db.add(timeline_entry)

    await db.commit()
    return {
        "success": True,
        "ticket_id": ticket.id,
        "message": "Your inquiry has been received. Our team will review it shortly.",
    }


# ---------------- Web Chat Visitor Sessions ----------------
async def initialize_web_chat(
    db: AsyncSession,
    request: WebChatInitRequest,
) -> WebChatInitResponse:
    res = await db.execute(select(Tenant).where(Tenant.slug == request.tenant_slug))
    tenant = res.scalar_one_or_none()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workspace '{request.tenant_slug}' not found"
        )

    session_id = str(uuid.uuid4())
    visitor_token = create_access_token(
        subject=f"visitor:{session_id}",
        claims={"tenant_id": tenant.id, "role": "visitor"},
    )

    session = WebChatVisitorSession(
        id=session_id,
        tenant_id=tenant.id,
        visitor_token=visitor_token,
        visitor_name=request.visitor_name,
        visitor_email=str(request.visitor_email) if request.visitor_email else None,
        session_status="active",
    )
    db.add(session)
    await db.commit()

    return WebChatInitResponse(
        session_id=session_id,
        visitor_token=visitor_token,
        tenant_name=tenant.name,
        welcome_message="Hello! How can we assist you today?",
    )


# ---------------- Inbound Webhook Handlers ----------------
async def handle_inbound_email_webhook(
    db: AsyncSession,
    tenant_slug: str,
    payload: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Process incoming email webhook (e.g. SendGrid, Mailgun, AWS SES).
    Extracts headers, sender, threading headers, and maps to conversation ticket.
    """
    res = await db.execute(select(Tenant).where(Tenant.slug == tenant_slug))
    tenant = res.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")

    sender_email = payload.get("from", "unknown@sender.com").lower().strip()
    sender_name = payload.get("from_name", sender_email.split("@")[0])
    subject = payload.get("subject", "Email inquiry")
    body = payload.get("text") or payload.get("html") or "Empty message body"

    # Create ticket for email
    ticket_id = f"SD-{uuid.uuid4().hex[:4].upper()}"
    ticket = Ticket(
        id=ticket_id,
        tenant_id=tenant.id,
        subject=subject,
        description=body,
        category="Email Support",
        channel=TicketChannel.EMAIL,
        status=TicketStatus.OPEN,
        priority=TicketPriority.MEDIUM,
    )
    db.add(ticket)
    await db.flush()

    msg = TicketMessage(
        ticket_id=ticket.id,
        sender_type=MessageSenderType.CUSTOMER,
        sender_name=sender_name,
        content=body,
    )
    db.add(msg)
    await db.commit()

    return {"status": "processed", "ticket_id": ticket.id}


async def handle_whatsapp_webhook(
    db: AsyncSession,
    tenant_slug: str,
    payload: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Process inbound WhatsApp Business API webhook.
    """
    res = await db.execute(select(Tenant).where(Tenant.slug == tenant_slug))
    tenant = res.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")

    sender_phone = payload.get("from_phone", "+10000000000")
    message_text = payload.get("message", "WhatsApp message")

    ticket_id = f"SD-{uuid.uuid4().hex[:4].upper()}"
    ticket = Ticket(
        id=ticket_id,
        tenant_id=tenant.id,
        subject=f"WhatsApp chat from {sender_phone}",
        description=message_text,
        category="WhatsApp Chat",
        channel=TicketChannel.WHATSAPP,
        status=TicketStatus.OPEN,
        priority=TicketPriority.MEDIUM,
    )
    db.add(ticket)
    await db.flush()

    msg = TicketMessage(
        ticket_id=ticket.id,
        sender_type=MessageSenderType.CUSTOMER,
        sender_name=f"WhatsApp User ({sender_phone})",
        content=message_text,
    )
    db.add(msg)
    await db.commit()

    return {"status": "processed", "ticket_id": ticket.id}

