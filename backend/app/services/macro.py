import json
from typing import Any, Dict, List
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.macro import Macro
from app.models.ticket import Ticket, TicketMessage, TicketPriority, TicketStatus, TicketTimeline, MessageSenderType
from app.models.user import User
from app.schemas.workflow import MacroCreate


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


async def ensure_default_macros(db: AsyncSession, tenant_id: str):
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
    macro = Macro(
        tenant_id=tenant_id,
        title=macro_in.title.strip(),
        description=macro_in.description,
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
) -> List[Macro]:
    await ensure_default_macros(db, tenant_id)
    result = await db.execute(
        select(Macro).where(Macro.tenant_id == tenant_id).order_by(Macro.title.asc())
    )
    return list(result.scalars().all())


def render_template(template_str: str, context: Dict[str, str]) -> str:
    rendered = template_str
    for key, val in context.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", str(val))
    return rendered


async def apply_macro_to_ticket(
    db: AsyncSession,
    macro_id: str,
    ticket_id: str,
    tenant_id: str,
    current_user: User,
) -> Dict[str, Any]:
    res_macro = await db.execute(
        select(Macro).where(Macro.id == macro_id, Macro.tenant_id == tenant_id)
    )
    macro = res_macro.scalar_one_or_none()
    if not macro or not macro.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Macro not found or inactive")

    query_ticket = (
        select(Ticket)
        .where(Ticket.id == ticket_id, Ticket.tenant_id == tenant_id)
        .options(selectinload(Ticket.customer), selectinload(Ticket.messages))
    )
    res_ticket = await db.execute(query_ticket)
    ticket = res_ticket.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    actions = json.loads(macro.actions_json)

    # Build template context
    customer_name = ticket.customer.name if ticket.customer else "Valued Customer"
    context = {
        "ticket.id": ticket.id,
        "ticket.subject": ticket.subject,
        "customer.name": customer_name,
        "agent.name": current_user.name,
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
        new_status = actions["status"]
        if hasattr(TicketStatus, new_status.upper()):
            ticket.status = getattr(TicketStatus, new_status.upper())
            applied_actions.append(f"status_changed_to_{new_status}")

    # 4. Priority update
    if "priority" in actions:
        new_priority = actions["priority"]
        if hasattr(TicketPriority, new_priority.upper()):
            ticket.priority = getattr(TicketPriority, new_priority.upper())
            applied_actions.append(f"priority_changed_to_{new_priority}")

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
        "macro_title": macro.title,
        "applied_actions": applied_actions,
    }

