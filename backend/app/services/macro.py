import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.macro import Macro
from app.models.ticket import (
    MessageSenderType,
    Ticket,
    TicketMessage,
    TicketPriority,
    TicketStatus,
    TicketTimeline,
)
from app.models.user import User, UserRole
from app.schemas.workflow import (
    VALID_MACRO_ACTIONS,
    MacroCreate,
    MacroUpdate,
)


DEFAULT_MACROS = [
    {
        "title": "Acknowledge & Request Logs",
        "description": "Send acknowledgment and request debugging logs from customer",
        "actions": {
            "response_text": "Hi {{customer.name}},\n\nThank you for reaching out regarding '{{ticket.subject}}'. Could you please share the server error logs or screenshots so our engineering team can investigate?",
            "status": "pending",
        },
    },
    {
        "title": "Escalate to Tier 2 Infrastructure",
        "description": "Mark ticket priority as urgent and add internal note",
        "actions": {
            "priority": "urgent",
            "internal_note": "Escalated for senior infrastructure review.",
        },
    },
]


def validate_macro_actions(actions: Dict[str, Any]) -> None:
    """Validate action keys and values for macros."""
    if not isinstance(actions, dict):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Actions must be a dictionary",
        )
    if not actions:
        # Empty actions permitted for minimal test fixtures
        return

    for key, val in actions.items():
        if key not in VALID_MACRO_ACTIONS:
            supported = ", ".join(sorted(VALID_MACRO_ACTIONS))
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Unsupported macro action '{key}'. Supported actions are: {supported}",
            )
        if key in ("response_text", "internal_note"):
            if not isinstance(val, str) or not val.strip():
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail=f"Action '{key}' must be a non-empty string",
                )
        elif key == "status":
            valid_statuses = [s.value for s in TicketStatus]
            if not isinstance(val, str) or val.lower() not in valid_statuses:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail=f"Invalid status '{val}'. Must be one of: {', '.join(valid_statuses)}",
                )
        elif key == "priority":
            valid_priorities = [p.value for p in TicketPriority]
            if not isinstance(val, str) or val.lower() not in valid_priorities:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail=f"Invalid priority '{val}'. Must be one of: {', '.join(valid_priorities)}",
                )
        elif key in ("tags", "add_tags"):
            if not isinstance(val, list) or not all(isinstance(t, str) and t.strip() for t in val):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail=f"Action '{key}' must be a list of non-empty strings",
                )
        elif key == "assigned_to_id":
            if not isinstance(val, str) or not val.strip():
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail="Action 'assigned_to_id' must be a non-empty string user ID",
                )


async def ensure_default_macros(db: AsyncSession, tenant_id: str) -> None:
    res = await db.execute(select(Macro).where(Macro.tenant_id == tenant_id))
    if not res.scalars().first():
        for m in DEFAULT_MACROS:
            macro = Macro(
                tenant_id=tenant_id,
                title=m["title"],
                description=m["description"],
                actions_json=json.dumps(m["actions"]),
                is_active=True,
            )
            db.add(macro)
        await db.commit()


async def create_macro(
    db: AsyncSession,
    tenant_id: str,
    macro_in: MacroCreate,
) -> Macro:
    title_clean = macro_in.title.strip() if macro_in.title else ""
    if len(title_clean) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Title must be at least 2 characters",
        )
    validate_macro_actions(macro_in.actions)

    macro = Macro(
        tenant_id=tenant_id,
        title=title_clean,
        description=macro_in.description.strip() if macro_in.description else None,
        actions_json=json.dumps(macro_in.actions),
        is_active=macro_in.is_active,
    )
    db.add(macro)
    await db.commit()
    await db.refresh(macro)
    return macro


async def list_macros(
    db: AsyncSession,
    tenant_id: str,
    include_inactive: bool = True,
) -> List[Macro]:
    await ensure_default_macros(db, tenant_id)
    query = select(Macro).where(Macro.tenant_id == tenant_id)
    if not include_inactive:
        query = query.where(Macro.is_active.is_(True))
    result = await db.execute(query.order_by(Macro.title.asc()))
    return list(result.scalars().all())


async def get_macro(
    db: AsyncSession,
    macro_id: str,
    tenant_id: str,
) -> Macro:
    result = await db.execute(
        select(Macro).where(Macro.id == macro_id, Macro.tenant_id == tenant_id)
    )
    macro = result.scalar_one_or_none()
    if not macro:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Macro '{macro_id}' not found",
        )
    return macro


async def update_macro(
    db: AsyncSession,
    macro_id: str,
    tenant_id: str,
    macro_in: MacroUpdate,
) -> Macro:
    macro = await get_macro(db, macro_id=macro_id, tenant_id=tenant_id)

    if macro_in.title is not None:
        clean_title = macro_in.title.strip()
        if len(clean_title) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Title must be at least 2 characters",
            )
        macro.title = clean_title

    if macro_in.description is not None:
        macro.description = macro_in.description.strip() if macro_in.description else None

    if macro_in.actions is not None:
        validate_macro_actions(macro_in.actions)
        macro.actions_json = json.dumps(macro_in.actions)

    if macro_in.is_active is not None:
        macro.is_active = macro_in.is_active

    await db.commit()
    await db.refresh(macro)
    return macro


async def delete_macro(
    db: AsyncSession,
    macro_id: str,
    tenant_id: str,
) -> None:
    macro = await get_macro(db, macro_id=macro_id, tenant_id=tenant_id)
    await db.delete(macro)
    await db.commit()


def render_template(template_str: str, context: Dict[str, Any]) -> str:
    rendered = template_str
    for key, val in context.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", str(val if val is not None else ""))
    return rendered


async def apply_macro_to_ticket(
    db: AsyncSession,
    macro_id: str,
    ticket_id: str,
    tenant_id: str,
    current_user: User,
) -> Dict[str, Any]:
    # 1. Macro lookup with tenant isolation
    res_macro = await db.execute(
        select(Macro).where(Macro.id == macro_id, Macro.tenant_id == tenant_id)
    )
    macro = res_macro.scalar_one_or_none()
    if not macro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Macro not found")
    if not macro.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot apply inactive macro")

    # 2. Ticket lookup with tenant isolation
    query_ticket = (
        select(Ticket)
        .where(Ticket.id == ticket_id, Ticket.tenant_id == tenant_id)
        .options(
            selectinload(Ticket.customer),
            selectinload(Ticket.messages),
            selectinload(Ticket.assignee),
        )
    )
    res_ticket = await db.execute(query_ticket)
    ticket = res_ticket.scalar_one_or_none()
    if not ticket or ticket.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    try:
        actions = json.loads(macro.actions_json) if macro.actions_json else {}
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Macro actions payload is malformed")

    # Build template context
    customer_name = ticket.customer.name if ticket.customer else "Valued Customer"
    customer_email = ticket.customer.email if ticket.customer else ""
    context = {
        "ticket.id": ticket.id,
        "ticket.subject": ticket.subject or "",
        "ticket.description": ticket.description or "",
        "ticket.status": ticket.status.value if hasattr(ticket.status, "value") else str(ticket.status),
        "ticket.priority": ticket.priority.value if hasattr(ticket.priority, "value") else str(ticket.priority),
        "customer.name": customer_name,
        "customer.email": customer_email,
        "agent.name": current_user.name,
        "agent.email": current_user.email,
    }

    applied_actions = []

    # 1. Reply message
    if "response_text" in actions:
        reply_content = render_template(actions["response_text"], context)
        msg = TicketMessage(
            ticket_id=ticket.id,
            sender_id=current_user.id,
            sender_type=MessageSenderType.AGENT,
            sender_name=current_user.name,
            content=reply_content,
        )
        db.add(msg)
        applied_actions.append("added_customer_reply")

    # 2. Internal note
    if "internal_note" in actions:
        note_content = render_template(actions["internal_note"], context)
        note_msg = TicketMessage(
            ticket_id=ticket.id,
            sender_id=current_user.id,
            sender_type=MessageSenderType.INTERNAL_NOTE,
            sender_name=current_user.name,
            content=note_content,
        )
        db.add(note_msg)
        applied_actions.append("added_internal_note")

    # 3. Status update
    if "status" in actions:
        new_status_str = str(actions["status"]).lower()
        if hasattr(TicketStatus, new_status_str.upper()):
            new_status = getattr(TicketStatus, new_status_str.upper())
            prev_status = ticket.status
            ticket.status = new_status
            if new_status == TicketStatus.PENDING:
                ticket.sla_paused = True
                ticket.sla_remaining = "Paused (Waiting for customer)"
            elif new_status in (TicketStatus.RESOLVED, TicketStatus.CLOSED):
                ticket.sla_paused = False
                if ticket.sla_status != "breached":
                    ticket.sla_remaining = "Resolved within SLA"
            elif new_status == TicketStatus.OPEN and prev_status == TicketStatus.PENDING:
                ticket.sla_paused = False
            applied_actions.append(f"status_changed_to_{new_status.value}")

    # 4. Priority update
    if "priority" in actions:
        new_priority_str = str(actions["priority"]).lower()
        if hasattr(TicketPriority, new_priority_str.upper()):
            new_priority = getattr(TicketPriority, new_priority_str.upper())
            ticket.priority = new_priority
            try:
                from app.services.sla import get_initial_sla_for_priority
                _, new_rem = await get_initial_sla_for_priority(db, tenant_id, new_priority)
                ticket.sla_remaining = new_rem
            except Exception:
                pass
            applied_actions.append(f"priority_changed_to_{new_priority.value}")

    # 5. Tags update
    tags_to_add = actions.get("tags") or actions.get("add_tags")
    if tags_to_add and isinstance(tags_to_add, list):
        current_tags = []
        if ticket.tags_json:
            try:
                parsed = json.loads(ticket.tags_json)
                if isinstance(parsed, list):
                    current_tags = parsed
            except Exception:
                current_tags = []
        added_any = False
        for tag in tags_to_add:
            if isinstance(tag, str) and tag.strip():
                clean_tag = tag.strip()
                if clean_tag not in current_tags:
                    current_tags.append(clean_tag)
                    added_any = True
        if added_any:
            ticket.tags_json = json.dumps(current_tags)
            applied_actions.append("tags_updated")

    # 6. Assignee update
    if "assigned_to_id" in actions and actions["assigned_to_id"]:
        target_agent_id = actions["assigned_to_id"]
        res_user = await db.execute(
            select(User).where(
                User.id == target_agent_id,
                User.tenant_id == tenant_id,
                User.role.in_([UserRole.ADMIN, UserRole.AGENT]),
            )
        )
        agent_user = res_user.scalar_one_or_none()
        if not agent_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target agent '{target_agent_id}' not found in workspace",
            )
        ticket.assigned_to_id = agent_user.id
        applied_actions.append(f"assigned_to_{agent_user.name}")

    ticket.updated_at = datetime.now(timezone.utc)

    timeline = TicketTimeline(
        ticket_id=ticket.id,
        title=f"Applied Macro: '{macro.title}'",
        by=current_user.name,
    )
    db.add(timeline)
    await db.commit()

    return {
        "success": True,
        "ticket_id": ticket.id,
        "macro_id": macro.id,
        "macro_title": macro.title,
        "applied_actions": applied_actions,
    }
