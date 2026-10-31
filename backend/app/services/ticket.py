import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.team import Team
from app.models.ticket import (
    Ticket,
    TicketChannel,
    TicketMessage,
    TicketPriority,
    TicketStatus,
    TicketTimeline,
    MessageSenderType,
)
from app.models.user import User, UserRole
from app.schemas.ticket import TicketCreate, TicketUpdate, TicketMessageCreate


async def create_ticket(
    db: AsyncSession,
    tenant_id: str,
    ticket_in: TicketCreate,
    current_user: Optional[User] = None,
) -> Ticket:
    """
    Create a new support ticket and record initial message & audit timeline.
    """
    stripped_subject = ticket_in.subject.strip()
    if len(stripped_subject) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Ticket subject must be at least 2 characters",
        )
    stripped_desc = ticket_in.description.strip()
    if len(stripped_desc) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Ticket description must be at least 2 characters",
        )

    customer_id = current_user.id if current_user else None
    sender_name = current_user.name if current_user else (ticket_in.customer_name or "Customer")

    ticket_id = f"SD-{uuid.uuid4().hex[:4].upper()}"

    priority = ticket_in.priority or TicketPriority.MEDIUM
    from app.services.sla import get_initial_sla_for_priority
    sla_status, sla_remaining = await get_initial_sla_for_priority(db, tenant_id, priority)

    ticket = Ticket(
        id=ticket_id,
        tenant_id=tenant_id,
        subject=stripped_subject,
        description=stripped_desc,
        category=ticket_in.category or "General Support",
        channel=ticket_in.channel or TicketChannel.WEB,
        status=TicketStatus.OPEN,
        priority=priority,
        customer_id=customer_id,
        sla_remaining=sla_remaining,
        sla_status=sla_status,
        ai_confidence="92%",
        ai_suggested_action="Review incoming customer details and check knowledge base for solution."
    )
    db.add(ticket)
    await db.flush()

    # Initial conversation message
    first_message = TicketMessage(
        ticket_id=ticket.id,
        sender_id=customer_id,
        sender_type=MessageSenderType.CUSTOMER,
        sender_name=sender_name,
        content=ticket_in.description,
    )
    db.add(first_message)

    # Audit timeline event
    timeline_event = TicketTimeline(
        ticket_id=ticket.id,
        title="Ticket opened via self-service",
        by=sender_name
    )
    db.add(timeline_event)

    await db.commit()

    # Auto-assign if active routing rule is configured
    from app.models.routing import RoutingRule
    from app.services.routing import auto_assign_ticket
    try:
        rule_check = await db.execute(
            select(RoutingRule.id).where(
                RoutingRule.tenant_id == tenant_id,
                RoutingRule.is_active.is_(True),
            ).limit(1)
        )
        if rule_check.scalar_one_or_none():
            await auto_assign_ticket(db, ticket.id, tenant_id)
    except Exception:
        pass
    query = (
        select(Ticket)
        .where(Ticket.id == ticket.id)
        .options(
            selectinload(Ticket.customer),
            selectinload(Ticket.assignee),
            selectinload(Ticket.messages),
            selectinload(Ticket.timeline),
        )
    )
    result = await db.execute(query)
    return result.scalar_one()


async def list_tickets(
    db: AsyncSession,
    tenant_id: str,
    current_user: User,
    status_filter: Optional[TicketStatus] = None,
    priority_filter: Optional[TicketPriority] = None,
    channel_filter: Optional[TicketChannel] = None,
    page: int = 1,
    limit: int = 20,
) -> Tuple[List[Ticket], int]:
    """
    Retrieve tickets scoped by tenant and user role with filtering and pagination.
    """
    query = (
        select(Ticket)
        .where(Ticket.tenant_id == tenant_id)
        .options(
            selectinload(Ticket.customer),
            selectinload(Ticket.assignee),
            selectinload(Ticket.messages),
            selectinload(Ticket.timeline),
        )
    )

    # Role-based scoping: Customers can only view their own tickets
    if current_user.role == UserRole.CUSTOMER:
        query = query.where(Ticket.customer_id == current_user.id)

    if status_filter:
        query = query.where(Ticket.status == status_filter)
    if priority_filter:
        query = query.where(Ticket.priority == priority_filter)
    if channel_filter:
        query = query.where(Ticket.channel == channel_filter)

    # Count total matching
    count_query = select(func.count(Ticket.id)).where(Ticket.tenant_id == tenant_id)
    if current_user.role == UserRole.CUSTOMER:
        count_query = count_query.where(Ticket.customer_id == current_user.id)
    if status_filter:
        count_query = count_query.where(Ticket.status == status_filter)
    if priority_filter:
        count_query = count_query.where(Ticket.priority == priority_filter)
    if channel_filter:
        count_query = count_query.where(Ticket.channel == channel_filter)

    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    # Paginate and order by newest first
    offset = (page - 1) * limit
    query = query.order_by(Ticket.created_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    tickets = result.scalars().all()

    return list(tickets), total


async def get_ticket(
    db: AsyncSession,
    ticket_id: str,
    tenant_id: str,
    current_user: User,
) -> Ticket:
    """
    Get a single ticket by ID enforcing tenant isolation and role restrictions.
    """
    query = (
        select(Ticket)
        .where(Ticket.id == ticket_id, Ticket.tenant_id == tenant_id)
        .options(
            selectinload(Ticket.customer),
            selectinload(Ticket.assignee),
            selectinload(Ticket.messages),
            selectinload(Ticket.timeline),
        )
    )
    result = await db.execute(query)
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket '{ticket_id}' not found"
        )

    # If customer, must own ticket
    if current_user.role == UserRole.CUSTOMER and ticket.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not have permission to view this ticket"
        )

    # Customers must never see internal notes in conversation thread
    if current_user.role == UserRole.CUSTOMER and ticket.messages:
        ticket.messages = [
            m for m in ticket.messages if m.sender_type != MessageSenderType.INTERNAL_NOTE
        ]

    return ticket


async def update_ticket(
    db: AsyncSession,
    ticket_id: str,
    tenant_id: str,
    current_user: User,
    update_data: TicketUpdate,
) -> Ticket:
    """
    Update ticket attributes (status, priority, assignee, team, tags) with permission validation.
    """
    ticket = await get_ticket(db, ticket_id, tenant_id, current_user)

    if current_user.role == UserRole.CUSTOMER:
        # Customers can only close their own tickets
        if update_data.status and update_data.status != TicketStatus.CLOSED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Customers may only change status to 'closed'"
            )
        if (
            update_data.priority
            or update_data.assigned_to_id
            or update_data.team_id
            or update_data.sla_paused
            or update_data.tags_json
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Customers cannot reassign, change priority, or modify internal fields of tickets"
            )

    timeline_notes = []

    if update_data.status and update_data.status != ticket.status:
        timeline_notes.append(f"Status changed from {ticket.status.value} to {update_data.status.value}")
        prev_status = ticket.status
        ticket.status = update_data.status
        if update_data.status == TicketStatus.PENDING:
            ticket.sla_paused = True
            ticket.sla_remaining = "Paused (Waiting for customer)"
            timeline_notes.append("Ticket SLA timer paused (status changed to pending)")
        elif update_data.status in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
            ticket.sla_paused = False
            if ticket.sla_status != "breached":
                ticket.sla_remaining = "Resolved within SLA"
            timeline_notes.append(f"Ticket SLA completed (status changed to {update_data.status.value})")
        elif update_data.status == TicketStatus.OPEN and prev_status == TicketStatus.PENDING:
            ticket.sla_paused = False
            timeline_notes.append("Ticket SLA timer resumed (status changed to open)")

    if update_data.priority and update_data.priority != ticket.priority:
        timeline_notes.append(f"Priority changed from {ticket.priority.value} to {update_data.priority.value}")
        ticket.priority = update_data.priority
        from app.services.sla import get_initial_sla_for_priority
        _, new_rem = await get_initial_sla_for_priority(db, tenant_id, update_data.priority)
        ticket.sla_remaining = new_rem

    if update_data.assigned_to_id is not None:
        target_agent_id = update_data.assigned_to_id.strip() if update_data.assigned_to_id else None
        if target_agent_id:
            assignee_res = await db.execute(
                select(User).where(
                    User.id == target_agent_id,
                    User.tenant_id == tenant_id,
                )
            )
            assignee = assignee_res.scalar_one_or_none()
            if not assignee:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Assigned agent '{target_agent_id}' not found in this workspace",
                )
            ticket.assigned_to_id = assignee.id
        else:
            ticket.assigned_to_id = None
        timeline_notes.append("Ticket re-assigned")

    if update_data.team_id is not None:
        target_team_id = update_data.team_id.strip() if update_data.team_id else None
        if target_team_id:
            team_res = await db.execute(
                select(Team).where(
                    Team.id == target_team_id,
                    Team.tenant_id == tenant_id,
                )
            )
            target_team = team_res.scalar_one_or_none()
            if not target_team:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Target team '{target_team_id}' not found in this workspace",
                )
            ticket.team_id = target_team.id
        else:
            ticket.team_id = None
        timeline_notes.append("Ticket team re-assigned")

    if update_data.subject is not None:
        stripped_sub = update_data.subject.strip()
        if len(stripped_sub) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Ticket subject must be at least 2 characters",
            )
        ticket.subject = stripped_sub

    if update_data.description is not None:
        stripped_desc = update_data.description.strip()
        if len(stripped_desc) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Ticket description must be at least 2 characters",
            )
        ticket.description = stripped_desc

    if update_data.category:
        ticket.category = update_data.category

    if update_data.tags_json is not None:
        try:
            parsed = json.loads(update_data.tags_json)
            if not isinstance(parsed, list):
                raise ValueError()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="tags_json must be a valid JSON array string",
            )
        ticket.tags_json = update_data.tags_json

    if update_data.sla_paused is not None and update_data.sla_paused != ticket.sla_paused:
        ticket.sla_paused = update_data.sla_paused
        action_str = "paused" if update_data.sla_paused else "resumed"
        timeline_notes.append(f"Ticket SLA timer {action_str}")
        if update_data.sla_paused:
            ticket.sla_remaining = "Paused (Waiting for customer)"
        elif update_data.sla_remaining is None:
            from app.services.sla import get_initial_sla_for_priority
            _, new_rem = await get_initial_sla_for_priority(db, tenant_id, ticket.priority)
            ticket.sla_remaining = new_rem

    if update_data.sla_remaining is not None:
        ticket.sla_remaining = update_data.sla_remaining

    if update_data.sla_status is not None:
        ticket.sla_status = update_data.sla_status

    for note in timeline_notes:
        timeline_entry = TicketTimeline(
            ticket_id=ticket.id,
            title=note,
            by=current_user.name
        )
        db.add(timeline_entry)

    await db.commit()
    query = (
        select(Ticket)
        .where(Ticket.id == ticket.id)
        .options(
            selectinload(Ticket.customer),
            selectinload(Ticket.assignee),
            selectinload(Ticket.messages),
            selectinload(Ticket.timeline),
        )
    )
    result = await db.execute(query)
    updated_ticket = result.scalar_one()
    if current_user.role == UserRole.CUSTOMER and updated_ticket.messages:
        updated_ticket.messages = [
            m for m in updated_ticket.messages if m.sender_type != MessageSenderType.INTERNAL_NOTE
        ]
    return updated_ticket


async def add_ticket_message(
    db: AsyncSession,
    ticket_id: str,
    tenant_id: str,
    current_user: User,
    message_in: TicketMessageCreate,
) -> TicketMessage:
    """
    Append a new message or internal note to a ticket thread.
    """
    ticket = await get_ticket(db, ticket_id, tenant_id, current_user)

    # Validate sender type
    sender_type = message_in.sender_type or (
        MessageSenderType.AGENT if current_user.role in [UserRole.AGENT, UserRole.ADMIN] else MessageSenderType.CUSTOMER
    )

    if sender_type == MessageSenderType.INTERNAL_NOTE and current_user.role == UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customers cannot post internal notes"
        )

    msg = TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        sender_type=sender_type,
        sender_name=current_user.name,
        content=message_in.content,
    )
    db.add(msg)

    # Reopen ticket if customer responds to resolved/pending ticket
    if current_user.role == UserRole.CUSTOMER and ticket.status in [TicketStatus.PENDING, TicketStatus.RESOLVED]:
        ticket.status = TicketStatus.OPEN

    await db.commit()
    await db.refresh(msg)
    return msg


async def get_ticket_messages(
    db: AsyncSession,
    ticket_id: str,
    tenant_id: str,
    current_user: User,
) -> List[TicketMessage]:
    """
    Get messages for a ticket. If user is customer, filter out internal notes.
    """
    await get_ticket(db, ticket_id, tenant_id, current_user)

    query = select(TicketMessage).where(TicketMessage.ticket_id == ticket_id).order_by(TicketMessage.created_at.asc())
    if current_user.role == UserRole.CUSTOMER:
        query = query.where(TicketMessage.sender_type != MessageSenderType.INTERNAL_NOTE)

    result = await db.execute(query)
    return list(result.scalars().all())


# In-memory collision detection store for simultaneous viewing / typing: {ticket_id: {agent_name, viewing_at, is_typing}}
ACTIVE_COLLISIONS: dict = {}


async def soft_delete_ticket(
    db: AsyncSession,
    ticket_id: str,
    tenant_id: str,
    current_user: User,
) -> Ticket:
    ticket = await get_ticket(db, ticket_id, tenant_id, current_user)
    ticket.is_deleted = True
    timeline = TicketTimeline(
        ticket_id=ticket.id,
        title="Ticket moved to trash (soft deleted)",
        by=current_user.name,
    )
    db.add(timeline)
    await db.commit()
    return await get_ticket(db, ticket_id, tenant_id, current_user)


async def restore_ticket(
    db: AsyncSession,
    ticket_id: str,
    tenant_id: str,
    current_user: User,
) -> Ticket:
    ticket = await get_ticket(db, ticket_id, tenant_id, current_user)
    ticket.is_deleted = False
    timeline = TicketTimeline(
        ticket_id=ticket.id,
        title="Ticket restored from trash",
        by=current_user.name,
    )
    db.add(timeline)
    await db.commit()
    return await get_ticket(db, ticket_id, tenant_id, current_user)


async def mark_ticket_spam(
    db: AsyncSession,
    ticket_id: str,
    tenant_id: str,
    current_user: User,
) -> Ticket:
    ticket = await get_ticket(db, ticket_id, tenant_id, current_user)
    ticket.is_spam = True
    ticket.status = TicketStatus.CLOSED
    timeline = TicketTimeline(
        ticket_id=ticket.id,
        title="Ticket flagged as spam",
        by=current_user.name,
    )
    db.add(timeline)
    await db.commit()
    return await get_ticket(db, ticket_id, tenant_id, current_user)


async def merge_tickets(
    db: AsyncSession,
    source_ticket_id: str,
    target_ticket_id: str,
    tenant_id: str,
    current_user: User,
) -> Ticket:
    if source_ticket_id == target_ticket_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot merge a ticket into itself",
        )
    source = await get_ticket(db, source_ticket_id, tenant_id, current_user)
    target = await get_ticket(db, target_ticket_id, tenant_id, current_user)

    source.merged_into_id = target.id
    source.status = TicketStatus.CLOSED

    # Copy messages from source to target
    res_msgs = await db.execute(
        select(TicketMessage).where(TicketMessage.ticket_id == source.id)
    )
    for m in res_msgs.scalars().all():
        merged_msg = TicketMessage(
            ticket_id=target.id,
            sender_id=m.sender_id,
            sender_type=m.sender_type,
            sender_name=f"[Merged from {source.id}] {m.sender_name}",
            content=m.content,
        )
        db.add(merged_msg)

    timeline_target = TicketTimeline(
        ticket_id=target.id,
        title=f"Merged ticket {source.id} into this ticket",
        by=current_user.name,
    )
    timeline_source = TicketTimeline(
        ticket_id=source.id,
        title=f"Merged into ticket {target.id} and closed",
        by=current_user.name,
    )
    db.add(timeline_target)
    db.add(timeline_source)

    await db.commit()
    return await get_ticket(db, target.id, tenant_id, current_user)


async def get_ticket_timeline(
    db: AsyncSession,
    ticket_id: str,
    tenant_id: str,
    current_user: User,
) -> List[TicketTimeline]:
    """
    Return the ordered audit timeline for a ticket. Verifies tenant ownership first.
    """
    # Reuse get_ticket to enforce tenant isolation and customer ownership
    await get_ticket(db, ticket_id, tenant_id, current_user)

    result = await db.execute(
        select(TicketTimeline)
        .where(TicketTimeline.ticket_id == ticket_id)
        .order_by(TicketTimeline.created_at.asc())
    )
    return list(result.scalars().all())


def record_collision(ticket_id: str, tenant_id: str, agent_name: str, is_typing: bool = False):
    """
    Record agent collision for a ticket. The caller must have already verified
    tenant ownership of the ticket via get_ticket() before calling this.
    Collision state is scoped to (tenant_id, ticket_id) to prevent cross-tenant
    information disclosure through the in-memory store.
    """
    key = f"{tenant_id}:{ticket_id}"
    ACTIVE_COLLISIONS[key] = {
        "agent_name": agent_name,
        "is_typing": is_typing,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    return ACTIVE_COLLISIONS[key]


def get_collision(ticket_id: str, tenant_id: str):
    """
    Get current collision state for a ticket, scoped to the caller's tenant.
    The caller must have already verified tenant ownership of the ticket.
    """
    key = f"{tenant_id}:{ticket_id}"
    return ACTIVE_COLLISIONS.get(key, {"active_agent": None, "is_typing": False})
