import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.automation import AutomationLog, AutomationRule
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
    VALID_AUTOMATION_ACTIONS,
    VALID_CONDITION_FIELDS,
    VALID_CONDITION_OPS,
    VALID_TRIGGERS,
    AutomationRuleCreate,
    AutomationRuleUpdate,
)


def validate_automation_rule(
    name: Optional[str] = None,
    trigger_event: Optional[str] = None,
    conditions: Optional[List[Dict[str, Any]]] = None,
    actions: Optional[List[Dict[str, Any]]] = None,
) -> None:
    """Validate automation rule fields and raise HTTP 422 if invalid."""
    if name is not None:
        clean_name = name.strip()
        if len(clean_name) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Rule name must be at least 2 characters",
            )

    if trigger_event is not None and trigger_event not in VALID_TRIGGERS:
        supported = ", ".join(sorted(VALID_TRIGGERS))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Invalid trigger_event '{trigger_event}'. Supported triggers: {supported}",
        )

    if conditions is not None:
        if not isinstance(conditions, list):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Conditions must be a list",
            )
        for cond in conditions:
            if not isinstance(cond, dict):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail="Each condition must be an object",
                )
            field = cond.get("field")
            op = cond.get("op", "==")
            if not field or field not in VALID_CONDITION_FIELDS:
                supported_fields = ", ".join(sorted(VALID_CONDITION_FIELDS))
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail=f"Unsupported condition field '{field}'. Supported fields: {supported_fields}",
                )
            if op not in VALID_CONDITION_OPS:
                supported_ops = ", ".join(sorted(VALID_CONDITION_OPS))
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail=f"Unsupported condition operator '{op}'. Supported operators: {supported_ops}",
                )

    if actions is not None:
        if not isinstance(actions, list):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Actions must be a list",
            )
        for act in actions:
            if not isinstance(act, dict):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail="Each action must be an object",
                )
            action_type = act.get("action")
            if not action_type or action_type not in VALID_AUTOMATION_ACTIONS:
                supported_actions = ", ".join(sorted(VALID_AUTOMATION_ACTIONS))
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail=f"Unsupported action '{action_type}'. Supported actions: {supported_actions}",
                )
            value = act.get("value")
            if action_type == "set_status":
                if str(value).lower() not in [s.value for s in TicketStatus]:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                        detail=f"Invalid status '{value}'. Must be one of: {', '.join(s.value for s in TicketStatus)}",
                    )
            elif action_type == "set_priority":
                if str(value).lower() not in [p.value for p in TicketPriority]:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                        detail=f"Invalid priority '{value}'. Must be one of: {', '.join(p.value for p in TicketPriority)}",
                    )
            elif action_type in ("add_tag", "remove_tag"):
                if not (isinstance(value, str) or (isinstance(value, list) and all(isinstance(x, str) for x in value))):
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                        detail=f"Action '{action_type}' value must be a string tag or list of string tags",
                    )
            elif action_type in ("assign_agent", "assign_team", "add_internal_note"):
                if not isinstance(value, str) or not value.strip():
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                        detail=f"Action '{action_type}' value must be a non-empty string",
                    )
            elif action_type == "set_sla_paused":
                if not isinstance(value, bool):
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                        detail="Action 'set_sla_paused' value must be a boolean",
                    )


async def create_automation_rule(
    db: AsyncSession,
    tenant_id: str,
    rule_in: AutomationRuleCreate,
) -> AutomationRule:
    validate_automation_rule(
        name=rule_in.name,
        trigger_event=rule_in.trigger_event,
        conditions=rule_in.conditions,
        actions=rule_in.actions,
    )

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
    trigger_event: Optional[str] = None,
    include_inactive: bool = True,
) -> List[AutomationRule]:
    query = select(AutomationRule).where(AutomationRule.tenant_id == tenant_id)
    if trigger_event:
        query = query.where(AutomationRule.trigger_event == trigger_event)
    if not include_inactive:
        query = query.where(AutomationRule.is_active.is_(True))
    result = await db.execute(query.order_by(AutomationRule.created_at.desc()))
    return list(result.scalars().all())


async def get_automation_rule(
    db: AsyncSession,
    rule_id: str,
    tenant_id: str,
) -> AutomationRule:
    result = await db.execute(
        select(AutomationRule).where(
            AutomationRule.id == rule_id,
            AutomationRule.tenant_id == tenant_id,
        )
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Automation rule '{rule_id}' not found",
        )
    return rule


async def update_automation_rule(
    db: AsyncSession,
    rule_id: str,
    tenant_id: str,
    rule_in: AutomationRuleUpdate,
) -> AutomationRule:
    rule = await get_automation_rule(db, rule_id=rule_id, tenant_id=tenant_id)

    validate_automation_rule(
        name=rule_in.name,
        trigger_event=rule_in.trigger_event,
        conditions=rule_in.conditions,
        actions=rule_in.actions,
    )

    if rule_in.name is not None:
        rule.name = rule_in.name.strip()
    if rule_in.trigger_event is not None:
        rule.trigger_event = rule_in.trigger_event
    if rule_in.conditions is not None:
        rule.conditions_json = json.dumps(rule_in.conditions)
    if rule_in.actions is not None:
        rule.actions_json = json.dumps(rule_in.actions)
    if rule_in.is_active is not None:
        rule.is_active = rule_in.is_active

    await db.commit()
    await db.refresh(rule)
    return rule


async def delete_automation_rule(
    db: AsyncSession,
    rule_id: str,
    tenant_id: str,
) -> None:
    rule = await get_automation_rule(db, rule_id=rule_id, tenant_id=tenant_id)
    await db.delete(rule)
    await db.commit()


async def list_automation_logs(
    db: AsyncSession,
    tenant_id: str,
    rule_id: Optional[str] = None,
    ticket_id: Optional[str] = None,
    limit: int = 50,
) -> List[AutomationLog]:
    query = select(AutomationLog).where(AutomationLog.tenant_id == tenant_id)
    if rule_id:
        query = query.where(AutomationLog.rule_id == rule_id)
    if ticket_id:
        query = query.where(AutomationLog.ticket_id == ticket_id)
    query = query.order_by(AutomationLog.created_at.desc()).limit(limit)
    res = await db.execute(query)
    return list(res.scalars().all())


def evaluate_conditions(ticket: Ticket, conditions: List[Dict[str, Any]]) -> bool:
    """Evaluates whether ticket attributes satisfy the rule's conditions."""
    if not conditions:
        return True

    for cond in conditions:
        field = cond.get("field")
        op = cond.get("op", "==")
        expected = cond.get("value")

        if field == "tags":
            tags_list = []
            if ticket.tags_json:
                try:
                    parsed = json.loads(ticket.tags_json)
                    if isinstance(parsed, list):
                        tags_list = [str(t).lower() for t in parsed]
                except Exception:
                    tags_list = []
            expected_str = str(expected).lower() if expected is not None else ""
            if op in ("==", "contains", "in"):
                if expected_str not in tags_list:
                    return False
            elif op in ("!=", "not_contains", "not_in"):
                if expected_str in tags_list:
                    return False
            continue

        actual = getattr(ticket, field, None)
        if hasattr(actual, "value"):
            actual = actual.value

        actual_str = "" if actual is None else str(actual).lower()
        expected_str = "" if expected is None else str(expected).lower()

        if op in ("==", "equals"):
            if actual_str != expected_str:
                return False
        elif op in ("!=", "not_equals"):
            if actual_str == expected_str:
                return False
        elif op == "in":
            if isinstance(expected, list):
                if actual_str not in [str(x).lower() for x in expected]:
                    return False
            else:
                if actual_str not in expected_str:
                    return False
        elif op == "not_in":
            if isinstance(expected, list):
                if actual_str in [str(x).lower() for x in expected]:
                    return False
            else:
                if actual_str in expected_str:
                    return False
        elif op == "contains":
            if expected_str not in actual_str:
                return False
        elif op == "not_contains":
            if expected_str in actual_str:
                return False
        elif op == "starts_with":
            if not actual_str.startswith(expected_str):
                return False
        elif op == "ends_with":
            if not actual_str.endswith(expected_str):
                return False

    return True


async def execute_automations_for_event(
    db: AsyncSession,
    tenant_id: str,
    ticket_id: str,
    event_type: str,
    depth: int = 0,
) -> List[Dict[str, Any]]:
    """Evaluate and execute automation rules with loop protection and SLA integration."""
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
        return [{
            "rule_id": "system-loop-guard",
            "rule_name": "system-loop-guard",
            "applied": ["loop_prevented"],
            "status": "loop_prevented",
            "rule": "system-loop-guard",
        }]

    res_ticket = await db.execute(
        select(Ticket)
        .where(
            Ticket.id == ticket_id,
            Ticket.tenant_id == tenant_id,
        )
        .options(
            selectinload(Ticket.customer),
            selectinload(Ticket.assignee),
        )
    )
    ticket = res_ticket.scalar_one_or_none()
    if not ticket or ticket.is_deleted:
        return []

    res_rules = await db.execute(
        select(AutomationRule)
        .where(
            AutomationRule.tenant_id == tenant_id,
            AutomationRule.trigger_event == event_type,
            AutomationRule.is_active.is_(True),
        )
        .order_by(AutomationRule.created_at.asc())
    )
    rules = res_rules.scalars().all()

    execution_results = []

    for rule in rules:
        try:
            conditions = json.loads(rule.conditions_json) if rule.conditions_json else []
            actions = json.loads(rule.actions_json) if rule.actions_json else []
        except Exception:
            continue

        if not evaluate_conditions(ticket, conditions):
            continue

        applied = []
        for act in actions:
            action_type = act.get("action")
            value = act.get("value")

            if action_type == "set_priority":
                p_str = str(value).lower()
                if hasattr(TicketPriority, p_str.upper()):
                    ticket.priority = getattr(TicketPriority, p_str.upper())
                    try:
                        from app.services.sla import get_initial_sla_for_priority
                        _, new_rem = await get_initial_sla_for_priority(db, tenant_id, ticket.priority)
                        ticket.sla_remaining = new_rem
                    except Exception:
                        pass
                    applied.append(f"set_priority_{p_str}")

            elif action_type == "set_status":
                s_str = str(value).lower()
                if hasattr(TicketStatus, s_str.upper()):
                    prev_status = ticket.status
                    new_status = getattr(TicketStatus, s_str.upper())
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
                    applied.append(f"set_status_{s_str}")

            elif action_type == "add_tag":
                tags_to_add = [value] if isinstance(value, str) else (value if isinstance(value, list) else [])
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
                    clean_tag = str(tag).strip()
                    if clean_tag and clean_tag not in current_tags:
                        current_tags.append(clean_tag)
                        added_any = True
                if added_any:
                    ticket.tags_json = json.dumps(current_tags)
                    applied.append(f"added_tags_{','.join(tags_to_add)}")

            elif action_type == "remove_tag":
                tags_to_remove = [value] if isinstance(value, str) else (value if isinstance(value, list) else [])
                if ticket.tags_json:
                    try:
                        current_tags = json.loads(ticket.tags_json)
                        if isinstance(current_tags, list):
                            new_tags = [t for t in current_tags if t not in tags_to_remove]
                            if len(new_tags) != len(current_tags):
                                ticket.tags_json = json.dumps(new_tags)
                                applied.append(f"removed_tags_{','.join(tags_to_remove)}")
                    except Exception:
                        pass

            elif action_type == "assign_agent":
                agent_id = str(value).strip()
                res_agent = await db.execute(
                    select(User).where(
                        User.id == agent_id,
                        User.tenant_id == tenant_id,
                        User.role.in_([UserRole.ADMIN, UserRole.AGENT]),
                    )
                )
                agent = res_agent.scalar_one_or_none()
                if agent:
                    ticket.assigned_to_id = agent.id
                    applied.append(f"assigned_agent_{agent.id}")
                else:
                    applied.append(f"skipped_agent_not_found_{agent_id}")

            elif action_type == "assign_team":
                team_id = str(value).strip()
                from app.models.team import Team
                res_team = await db.execute(
                    select(Team).where(Team.id == team_id, Team.tenant_id == tenant_id)
                )
                team = res_team.scalar_one_or_none()
                if team:
                    ticket.team_id = team.id
                    applied.append(f"assigned_team_{team.id}")
                else:
                    applied.append(f"skipped_team_not_found_{team_id}")

            elif action_type == "add_internal_note":
                note_content = str(value).strip()
                if note_content:
                    note_msg = TicketMessage(
                        ticket_id=ticket.id,
                        sender_id=None,
                        sender_type=MessageSenderType.INTERNAL_NOTE,
                        sender_name="AutomationEngine",
                        content=note_content,
                    )
                    db.add(note_msg)
                    applied.append("added_internal_note")

            elif action_type == "set_sla_paused":
                ticket.sla_paused = bool(value)
                applied.append(f"set_sla_paused_{ticket.sla_paused}")

        rule.execution_count += 1
        ticket.updated_at = datetime.now(timezone.utc)

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
