import json
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.routing import RoutingRule
from app.models.ticket import Ticket, TicketTimeline
from app.models.user import User, UserRole
from app.schemas.workflow import (
    RoutingAssignResponse,
    RoutingRuleCreate,
    RoutingRuleUpdate,
    VALID_ROUTING_STRATEGIES,
)


async def create_routing_rule(
    db: AsyncSession,
    tenant_id: str,
    rule_in: RoutingRuleCreate,
) -> RoutingRule:
    stripped_name = rule_in.name.strip()
    if len(stripped_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Routing rule name must be at least 2 characters",
        )

    clean_strategy = rule_in.strategy.lower().strip()
    if clean_strategy not in VALID_ROUTING_STRATEGIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid routing strategy '{rule_in.strategy}'. Must be one of {list(VALID_ROUTING_STRATEGIES)}",
        )

    if rule_in.target_team_id:
        from app.models.team import Team
        team_res = await db.execute(
            select(Team).where(
                Team.id == rule_in.target_team_id,
                Team.tenant_id == tenant_id,
            )
        )
        if not team_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target team '{rule_in.target_team_id}' not found in this workspace",
            )

    rule = RoutingRule(
        tenant_id=tenant_id,
        name=stripped_name,
        strategy=clean_strategy,
        target_team_id=rule_in.target_team_id,
        required_skill=rule_in.required_skill,
        channel=rule_in.channel,
        is_active=rule_in.is_active,
        priority_order=rule_in.priority_order,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


async def get_routing_rule(
    db: AsyncSession,
    tenant_id: str,
    rule_id: str,
) -> RoutingRule:
    res = await db.execute(
        select(RoutingRule).where(
            RoutingRule.id == rule_id,
            RoutingRule.tenant_id == tenant_id,
        )
    )
    rule = res.scalar_one_or_none()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Routing rule '{rule_id}' not found in this workspace",
        )
    return rule


async def update_routing_rule(
    db: AsyncSession,
    tenant_id: str,
    rule_id: str,
    rule_in: RoutingRuleUpdate,
) -> RoutingRule:
    rule = await get_routing_rule(db, tenant_id, rule_id)

    if rule_in.name is not None:
        stripped_name = rule_in.name.strip()
        if len(stripped_name) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Routing rule name must be at least 2 characters",
            )
        rule.name = stripped_name

    if rule_in.strategy is not None:
        clean_strategy = rule_in.strategy.lower().strip()
        if clean_strategy not in VALID_ROUTING_STRATEGIES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid routing strategy '{rule_in.strategy}'. Must be one of {list(VALID_ROUTING_STRATEGIES)}",
            )
        rule.strategy = clean_strategy

    if rule_in.target_team_id is not None:
        target_team = rule_in.target_team_id.strip() if rule_in.target_team_id else None
        if target_team:
            from app.models.team import Team
            team_res = await db.execute(
                select(Team).where(
                    Team.id == target_team,
                    Team.tenant_id == tenant_id,
                )
            )
            if not team_res.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Target team '{target_team}' not found in this workspace",
                )
            rule.target_team_id = target_team
        else:
            rule.target_team_id = None

    if rule_in.required_skill is not None:
        rule.required_skill = rule_in.required_skill
    if rule_in.channel is not None:
        rule.channel = rule_in.channel
    if rule_in.is_active is not None:
        rule.is_active = rule_in.is_active
    if rule_in.priority_order is not None:
        rule.priority_order = rule_in.priority_order

    await db.commit()
    await db.refresh(rule)
    return rule


async def delete_routing_rule(
    db: AsyncSession,
    tenant_id: str,
    rule_id: str,
) -> RoutingRule:
    rule = await get_routing_rule(db, tenant_id, rule_id)
    await db.delete(rule)
    await db.commit()
    return rule


async def set_active_routing_strategy(
    db: AsyncSession,
    tenant_id: str,
    strategy: str,
    name: Optional[str] = None,
) -> RoutingRule:
    clean_strat = strategy.lower().strip()
    if clean_strat not in VALID_ROUTING_STRATEGIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid routing strategy '{strategy}'. Must be one of {list(VALID_ROUTING_STRATEGIES)}",
        )
    res = await db.execute(
        select(RoutingRule)
        .where(RoutingRule.tenant_id == tenant_id)
        .order_by(RoutingRule.priority_order.asc())
    )
    rule = res.scalars().first()
    if rule:
        rule.strategy = clean_strat
        if name:
            rule.name = name
        rule.is_active = True
        await db.commit()
        await db.refresh(rule)
        return rule
    else:
        new_rule = RoutingRule(
            tenant_id=tenant_id,
            name=name or f"Default {clean_strat.replace('_', ' ').title()}",
            strategy=clean_strat,
            is_active=True,
            priority_order=1,
        )
        db.add(new_rule)
        await db.commit()
        await db.refresh(new_rule)
        return new_rule


async def list_routing_rules(
    db: AsyncSession,
    tenant_id: str,
) -> List[RoutingRule]:
    result = await db.execute(
        select(RoutingRule)
        .where(RoutingRule.tenant_id == tenant_id)
        .order_by(RoutingRule.priority_order.asc())
    )
    return list(result.scalars().all())


async def auto_assign_ticket(
    db: AsyncSession,
    ticket_id: str,
    tenant_id: str,
    strategy: Optional[str] = None,
) -> RoutingAssignResponse:
    res = await db.execute(select(Ticket).where(Ticket.id == ticket_id, Ticket.tenant_id == tenant_id))
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    clean_strategy = strategy.lower().strip() if strategy else None
    if clean_strategy and clean_strategy not in VALID_ROUTING_STRATEGIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid routing strategy '{strategy}'. Must be one of {list(VALID_ROUTING_STRATEGIES)}",
        )

    # Find matching active rule if strategy not specified
    used_strategy = clean_strategy or "round_robin"
    target_team = ticket.team_id

    if not clean_strategy:
        res_rules = await db.execute(
            select(RoutingRule).where(
                RoutingRule.tenant_id == tenant_id,
                RoutingRule.is_active.is_(True)
            ).order_by(RoutingRule.priority_order.asc())
        )
        active_rules = res_rules.scalars().all()
        # Specific channel rule takes precedence over generic catch-all
        ticket_channel_str = ticket.channel.value if hasattr(ticket.channel, "value") else str(ticket.channel)
        matched_rule = None
        for r in active_rules:
            if r.channel and r.channel.lower() == ticket_channel_str.lower():
                matched_rule = r
                break
        if not matched_rule:
            for r in active_rules:
                if r.channel is None:
                    matched_rule = r
                    break

        if matched_rule:
            used_strategy = matched_rule.strategy
            target_team = matched_rule.target_team_id or target_team

    # Query eligible agents strictly within this tenant
    query_agents = select(User).where(
        User.tenant_id == tenant_id,
        User.role.in_([UserRole.AGENT, UserRole.ADMIN]),
        User.is_active.is_(True),
    )
    if target_team:
        # Check if team has active agents
        team_agents_query = query_agents.where(User.team_id == target_team)
        res_team_agents = await db.execute(team_agents_query)
        agents = res_team_agents.scalars().all()
        if not agents:
            # Fallback to workspace agents if team has no members assigned
            res_all_agents = await db.execute(query_agents)
            agents = res_all_agents.scalars().all()
    else:
        res_agents = await db.execute(query_agents)
        agents = res_agents.scalars().all()

    if not agents:
        return RoutingAssignResponse(
            ticket_id=ticket.id,
            assigned_to_id=None,
            assigned_to_name=None,
            strategy_used=used_strategy,
            message="No eligible agents found in workspace or team",
        )

    # Strategy: least_loaded
    if used_strategy == "least_loaded":
        counts = {}
        for ag in agents:
            count_res = await db.execute(
                select(func.count(Ticket.id)).where(
                    Ticket.tenant_id == tenant_id,
                    Ticket.assigned_to_id == ag.id,
                    Ticket.status.in_(["open", "pending"]),
                    Ticket.is_deleted.is_(False),
                )
            )
            counts[ag.id] = count_res.scalar() or 0
        selected_agent = min(agents, key=lambda a: counts.get(a.id, 0))

    else:
        # Strategy: round_robin
        # Find agent whose most recently assigned ticket is oldest (least recently assigned)
        agent_last_assigned = {}
        for ag in agents:
            last_res = await db.execute(
                select(func.max(Ticket.created_at)).where(
                    Ticket.tenant_id == tenant_id,
                    Ticket.assigned_to_id == ag.id,
                )
            )
            last_date = last_res.scalar()
            # If agent never had a ticket, set timestamp to unix epoch 0
            agent_last_assigned[ag.id] = last_date.timestamp() if last_date else 0

        selected_agent = min(agents, key=lambda a: agent_last_assigned.get(a.id, 0))

    ticket.assigned_to_id = selected_agent.id
    if target_team:
        ticket.team_id = target_team

    timeline = TicketTimeline(
        ticket_id=ticket.id,
        title=f"Auto-assigned to {selected_agent.name} via {used_strategy}",
        by="RoutingEngine",
    )
    db.add(timeline)
    await db.commit()

    return RoutingAssignResponse(
        ticket_id=ticket.id,
        assigned_to_id=selected_agent.id,
        assigned_to_name=selected_agent.name,
        strategy_used=used_strategy,
        message=f"Successfully assigned to {selected_agent.name}",
    )

