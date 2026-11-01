import json
from typing import Any, Dict, List
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.automation import AutomationLog, AutomationRule
from app.models.ticket import Ticket, TicketPriority, TicketStatus, TicketTimeline
from app.schemas.workflow import AutomationRuleCreate


async def create_automation_rule(
    db: AsyncSession,
    tenant_id: str,
    rule_in: AutomationRuleCreate,
) -> AutomationRule:
    rule = AutomationRule(
        tenant_id=tenant_id,
        name=rule_in.name.strip(),
        trigger_event=rule_in.trigger_event,
        conditions_json=json.dumps(rule_in.conditions),
        actions_json=json.dumps(rule_in.actions),
        is_active=rule_in.is_active,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


async def list_automation_rules(
    db: AsyncSession,
    tenant_id: str,
) -> List[AutomationRule]:
    result = await db.execute(
        select(AutomationRule)
        .where(AutomationRule.tenant_id == tenant_id)
        .order_by(AutomationRule.created_at.desc())
    )
    return list(result.scalars().all())


def evaluate_conditions(ticket: Ticket, conditions: List[Dict[str, Any]]) -> bool:
    """
    Evaluates whether ticket attributes satisfy the rule's conditions.
    """
    for cond in conditions:
        field = cond.get("field")
        op = cond.get("op", "==")
        expected = cond.get("value")

        actual = getattr(ticket, field, None)
        if hasattr(actual, "value"):
            actual = actual.value

        if op == "==" and str(actual).lower() != str(expected).lower():
            return False
        elif op == "!=" and str(actual).lower() == str(expected).lower():
            return False
        elif op == "in" and expected and actual not in expected:
            return False
    return True


async def execute_automations_for_event(
    db: AsyncSession,
    tenant_id: str,
    ticket_id: str,
    event_type: str,
    depth: int = 0,
) -> List[Dict[str, Any]]:
    """
    Evaluate and execute automation rules with recursive loop protection.
    """
    # Loop Protection: Prevent infinite execution loops
    MAX_LOOP_DEPTH = 3
    if depth >= MAX_LOOP_DEPTH:
        log = AutomationLog(
            tenant_id=tenant_id,
            rule_id="system-loop-guard",
            ticket_id=ticket_id,
            status="loop_prevented",
            details_json=json.dumps({"reason": f"Exceeded max execution depth {MAX_LOOP_DEPTH}"}),
        )
        db.add(log)
        await db.commit()
        return [{"status": "loop_prevented", "rule": "system-loop-guard"}]

    res_ticket = await db.execute(select(Ticket).where(Ticket.id == ticket_id, Ticket.tenant_id == tenant_id))
    ticket = res_ticket.scalar_one_or_none()
    if not ticket:
        return []

    # Query active rules for event
    res_rules = await db.execute(
        select(AutomationRule).where(
            AutomationRule.tenant_id == tenant_id,
            AutomationRule.trigger_event == event_type,
            AutomationRule.is_active.is_(True),
        )
    )
    rules = res_rules.scalars().all()

    execution_results = []

    for rule in rules:
        conditions = json.loads(rule.conditions_json)
        actions = json.loads(rule.actions_json)

        # Check conditions
        if not evaluate_conditions(ticket, conditions):
            continue

        # Execute actions
        applied = []
        for act in actions:
            action_type = act.get("action")
            value = act.get("value")

            if action_type == "set_priority":
                if hasattr(TicketPriority, str(value).upper()):
                    ticket.priority = getattr(TicketPriority, str(value).upper())
                    applied.append(f"set_priority_{value}")
            elif action_type == "set_status":
                if hasattr(TicketStatus, str(value).upper()):
                    ticket.status = getattr(TicketStatus, str(value).upper())
                    applied.append(f"set_status_{value}")

        rule.execution_count += 1
        log = AutomationLog(
            tenant_id=tenant_id,
            rule_id=rule.id,
            ticket_id=ticket.id,
            status="success",
            details_json=json.dumps({"applied_actions": applied}),
        )
        db.add(log)

        timeline = TicketTimeline(
            ticket_id=ticket.id,
            title=f"Automation '{rule.name}' executed",
            by="AutomationEngine",
        )
        db.add(timeline)
        execution_results.append({"rule_id": rule.id, "rule_name": rule.name, "applied": applied})

    await db.commit()
    return execution_results

