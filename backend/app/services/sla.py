from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sla import SLAPolicy
from app.models.ticket import (
    MessageSenderType,
    Ticket,
    TicketMessage,
    TicketPriority,
    TicketStatus,
)
from app.schemas.workflow import (
    SLAEvaluationResponse,
    SLAPolicyCreate,
    SLAPolicyUpdate,
    VALID_SLA_PRIORITIES,
)


DEFAULT_POLICIES = [
    {
        "name": "Enterprise Urgent (P1)",
        "priority": "urgent",
        "first_response_time_minutes": 15,
        "resolution_time_minutes": 120,
    },
    {
        "name": "Standard High (P2)",
        "priority": "high",
        "first_response_time_minutes": 60,
        "resolution_time_minutes": 360,
    },
    {
        "name": "Normal Support (P3)",
        "priority": "medium",
        "first_response_time_minutes": 240,
        "resolution_time_minutes": 1440,
    },
    {
        "name": "Low Priority (P4)",
        "priority": "low",
        "first_response_time_minutes": 480,
        "resolution_time_minutes": 2880,
    },
]


async def ensure_default_sla_policies(db: AsyncSession, tenant_id: str):
    res = await db.execute(select(SLAPolicy).where(SLAPolicy.tenant_id == tenant_id))
    if not res.scalars().first():
        for p in DEFAULT_POLICIES:
            policy = SLAPolicy(
                tenant_id=tenant_id,
                name=p["name"],
                priority=p["priority"],
                first_response_time_minutes=p["first_response_time_minutes"],
                resolution_time_minutes=p["resolution_time_minutes"],
                business_hours_only=True,
                is_active=True,
            )
            db.add(policy)
        await db.commit()


async def create_sla_policy(
    db: AsyncSession,
    tenant_id: str,
    policy_in: SLAPolicyCreate,
) -> SLAPolicy:
    stripped_name = policy_in.name.strip()
    if len(stripped_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="SLA policy name must be at least 2 characters",
        )
    priority_lower = policy_in.priority.lower().strip()
    if priority_lower not in VALID_SLA_PRIORITIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid priority '{policy_in.priority}'. Must be one of {list(VALID_SLA_PRIORITIES)}",
        )
    if policy_in.resolution_time_minutes < policy_in.first_response_time_minutes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Resolution time minutes must be greater than or equal to first response time minutes",
        )

    policy = SLAPolicy(
        tenant_id=tenant_id,
        name=stripped_name,
        description=policy_in.description,
        priority=priority_lower,
        first_response_time_minutes=policy_in.first_response_time_minutes,
        resolution_time_minutes=policy_in.resolution_time_minutes,
        business_hours_only=policy_in.business_hours_only,
        is_active=policy_in.is_active,
    )
    db.add(policy)
    await db.commit()
    await db.refresh(policy)
    return policy


async def get_sla_policy(
    db: AsyncSession,
    tenant_id: str,
    policy_id: str,
) -> SLAPolicy:
    res = await db.execute(
        select(SLAPolicy).where(SLAPolicy.id == policy_id, SLAPolicy.tenant_id == tenant_id)
    )
    policy = res.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"SLA policy '{policy_id}' not found")
    return policy


async def update_sla_policy(
    db: AsyncSession,
    tenant_id: str,
    policy_id: str,
    policy_in: SLAPolicyUpdate,
) -> SLAPolicy:
    policy = await get_sla_policy(db, tenant_id, policy_id)

    target_name = policy.name
    if policy_in.name is not None:
        target_name = policy_in.name.strip()
        if len(target_name) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="SLA policy name must be at least 2 characters",
            )
        policy.name = target_name

    if policy_in.description is not None:
        policy.description = policy_in.description

    if policy_in.priority is not None:
        p_lower = policy_in.priority.lower().strip()
        if p_lower not in VALID_SLA_PRIORITIES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid priority '{policy_in.priority}'. Must be one of {list(VALID_SLA_PRIORITIES)}",
            )
        policy.priority = p_lower

    new_resp_mins = policy_in.first_response_time_minutes if policy_in.first_response_time_minutes is not None else policy.first_response_time_minutes
    new_resol_mins = policy_in.resolution_time_minutes if policy_in.resolution_time_minutes is not None else policy.resolution_time_minutes

    if new_resol_mins < new_resp_mins:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Resolution time minutes must be greater than or equal to first response time minutes",
        )

    policy.first_response_time_minutes = new_resp_mins
    policy.resolution_time_minutes = new_resol_mins

    if policy_in.business_hours_only is not None:
        policy.business_hours_only = policy_in.business_hours_only

    if policy_in.is_active is not None:
        policy.is_active = policy_in.is_active

    await db.commit()
    await db.refresh(policy)
    return policy


async def delete_sla_policy(
    db: AsyncSession,
    tenant_id: str,
    policy_id: str,
) -> SLAPolicy:
    policy = await get_sla_policy(db, tenant_id, policy_id)
    await db.delete(policy)
    await db.commit()
    return policy


async def list_sla_policies(
    db: AsyncSession,
    tenant_id: str,
) -> List[SLAPolicy]:
    await ensure_default_sla_policies(db, tenant_id)
    result = await db.execute(
        select(SLAPolicy).where(SLAPolicy.tenant_id == tenant_id).order_by(SLAPolicy.first_response_time_minutes.asc())
    )
    return list(result.scalars().all())


async def get_initial_sla_for_priority(
    db: AsyncSession,
    tenant_id: str,
    priority: str,
) -> Tuple[str, str]:
    """
    Returns initial (sla_status, sla_remaining) based on the tenant's SLA policy.
    """
    priority_str = priority.value if hasattr(priority, "value") else str(priority).lower()
    await ensure_default_sla_policies(db, tenant_id)
    res = await db.execute(
        select(SLAPolicy).where(
            SLAPolicy.tenant_id == tenant_id,
            SLAPolicy.priority == priority_str,
            SLAPolicy.is_active.is_(True),
        )
    )
    policy = res.scalars().first()
    if policy:
        mins = policy.resolution_time_minutes
        if mins < 60:
            remaining = f"{mins}m"
        else:
            remaining = f"{mins // 60}h"
    else:
        defaults = {"urgent": "2h", "high": "6h", "medium": "24h", "low": "48h"}
        remaining = defaults.get(priority_str, "24h")
    return "safe", remaining


async def evaluate_ticket_sla(
    db: AsyncSession,
    ticket_id: str,
    tenant_id: str,
) -> SLAEvaluationResponse:
    await ensure_default_sla_policies(db, tenant_id)
    res = await db.execute(select(Ticket).where(Ticket.id == ticket_id, Ticket.tenant_id == tenant_id))
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    priority_str = ticket.priority.value if hasattr(ticket.priority, "value") else str(ticket.priority)
    res_policy = await db.execute(
        select(SLAPolicy).where(
            SLAPolicy.tenant_id == tenant_id,
            SLAPolicy.priority == priority_str.lower(),
            SLAPolicy.is_active.is_(True),
        )
    )
    policy = res_policy.scalars().first()

    first_resp_mins = policy.first_response_time_minutes if policy else 60
    resol_mins = policy.resolution_time_minutes if policy else 240

    is_paused = bool(ticket.status == TicketStatus.PENDING or ticket.sla_paused)
    is_resolved = ticket.status in [TicketStatus.RESOLVED, TicketStatus.CLOSED]

    # Calculate elapsed minutes
    now = datetime.now(timezone.utc)
    created_at = ticket.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    elapsed_minutes = max(0, int((now - created_at).total_seconds() / 60))

    # Check whether agent has responded
    agent_msg_res = await db.execute(
        select(TicketMessage.id).where(
            TicketMessage.ticket_id == ticket.id,
            TicketMessage.sender_type == MessageSenderType.AGENT,
        ).limit(1)
    )
    has_agent_reply = agent_msg_res.scalar_one_or_none() is not None

    if is_resolved:
        # Finalized SLA state
        if ticket.sla_status == "breached" or elapsed_minutes > resol_mins:
            sla_status = "breached"
            sla_remaining = "Resolved (SLA breached)"
        else:
            sla_status = "safe"
            sla_remaining = "Resolved within SLA"
        ticket.sla_paused = False
    elif is_paused:
        sla_status = "safe"
        sla_remaining = "Paused (Waiting for customer)"
        ticket.sla_paused = True
    elif not has_agent_reply and elapsed_minutes > first_resp_mins:
        sla_status = "breached"
        sla_remaining = f"First response breached ({elapsed_minutes - first_resp_mins}m ago)"
    elif elapsed_minutes > resol_mins:
        sla_status = "breached"
        sla_remaining = f"Breached ({elapsed_minutes - resol_mins}m ago)"
    elif not has_agent_reply and (first_resp_mins - elapsed_minutes) <= max(5, int(first_resp_mins * 0.25)):
        sla_status = "at-risk"
        sla_remaining = f"First response at risk ({first_resp_mins - elapsed_minutes}m left)"
    elif (resol_mins - elapsed_minutes) <= max(15, int(resol_mins * 0.25)):
        sla_status = "at-risk"
        sla_remaining = f"{resol_mins - elapsed_minutes}m left"
    else:
        sla_status = "safe"
        remaining_hours = max(1, int((resol_mins - elapsed_minutes) / 60))
        sla_remaining = f"{remaining_hours}h remaining"

    ticket.sla_status = sla_status
    ticket.sla_remaining = sla_remaining
    await db.commit()

    response_deadline = created_at + timedelta(minutes=first_resp_mins)
    resolution_deadline = created_at + timedelta(minutes=resol_mins)

    return SLAEvaluationResponse(
        ticket_id=ticket.id,
        priority=priority_str,
        sla_status=sla_status,
        sla_remaining=sla_remaining,
        first_response_due_minutes=first_resp_mins,
        resolution_due_minutes=resol_mins,
        is_paused=is_paused,
        response_deadline=response_deadline,
        resolution_deadline=resolution_deadline,
    )

