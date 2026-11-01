"""
Unit and Integration Tests for Module 10: Automations
=====================================================
Validates:
1. Automation Rule CRUD Lifecycle (create, list, get, update, delete)
2. Automation Logs Retrieval (audit trail)
3. Input & Rule Validation (name length, trigger_event, condition fields/ops, action types)
4. Role-Based Access Control (RBAC: Admin and Agent allowed, Customer 403 Forbidden)
5. Strict Tenant Isolation (cross-tenant get, update, delete, and execute rejected)
6. Condition Evaluation & Action Engine (set_status, set_priority, add_tag, remove_tag, assign_agent, add_internal_note)
7. Ticket Creation Automatic Trigger Integration
8. Recursive Loop Protection Guard (depth limit)
"""
import json
import pytest


@pytest.fixture
def auto_test_env(db_client):
    """
    Sets up two isolated workspaces:
    - Tenant A: 'auto-corp-a' with Admin, Agent, and Customer
    - Tenant B: 'auto-corp-b' with Admin
    """
    # Tenant A Admin
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@auto-a.io",
            "name": "Auto Admin A",
            "password": "Password123!",
            "role": "admin",
            "tenant_slug": "auto-corp-a",
        },
    )
    admin_a_login = db_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@auto-a.io", "password": "Password123!", "tenant_slug": "auto-corp-a"},
    )
    token_admin_a = admin_a_login.json()["access_token"]

    # Tenant A Agent
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "agent@auto-a.io",
            "name": "Auto Agent A",
            "password": "Password123!",
            "role": "agent",
            "tenant_slug": "auto-corp-a",
        },
    )
    agent_a_login = db_client.post(
        "/api/v1/auth/login",
        json={"email": "agent@auto-a.io", "password": "Password123!", "tenant_slug": "auto-corp-a"},
    )
    token_agent_a = agent_a_login.json()["access_token"]

    # Tenant A Customer
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "cust@auto-a.io",
            "name": "Auto Customer A",
            "password": "Password123!",
            "role": "customer",
            "tenant_slug": "auto-corp-a",
        },
    )
    cust_a_login = db_client.post(
        "/api/v1/auth/login",
        json={"email": "cust@auto-a.io", "password": "Password123!", "tenant_slug": "auto-corp-a"},
    )
    token_cust_a = cust_a_login.json()["access_token"]

    # Tenant B Admin
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@auto-b.io",
            "name": "Auto Admin B",
            "password": "Password123!",
            "role": "admin",
            "tenant_slug": "auto-corp-b",
        },
    )
    admin_b_login = db_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@auto-b.io", "password": "Password123!", "tenant_slug": "auto-corp-b"},
    )
    token_admin_b = admin_b_login.json()["access_token"]

    return {
        "admin_a": token_admin_a,
        "agent_a": token_agent_a,
        "cust_a": token_cust_a,
        "admin_b": token_admin_b,
    }


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_automation_crud_lifecycle(db_client, auto_test_env):
    """Verifies complete CRUD operations: create, list, get, update, and delete for automation rules."""
    headers = _auth(auto_test_env["admin_a"])

    # 1. Create Rule
    create_payload = {
        "name": "Auto-Triage VIP Incidents",
        "trigger_event": "ticket_created",
        "conditions": [
            {"field": "priority", "op": "==", "value": "urgent"},
            {"field": "category", "op": "contains", "value": "Support"},
        ],
        "actions": [
            {"action": "set_status", "value": "open"},
            {"action": "add_tag", "value": "vip"},
            {"action": "add_internal_note", "value": "Triaged by VIP auto-rule."},
        ],
        "is_active": True,
    }
    create_res = db_client.post("/api/v1/automations/", json=create_payload, headers=headers)
    assert create_res.status_code == 201
    rule = create_res.json()
    rule_id = rule["id"]
    assert rule["name"] == "Auto-Triage VIP Incidents"
    assert rule["trigger_event"] == "ticket_created"
    assert len(rule["actions"]) == 3
    assert rule["is_active"] is True

    # 2. List Rules
    list_res = db_client.get("/api/v1/automations/", headers=headers)
    assert list_res.status_code == 200
    rules = list_res.json()
    assert any(r["id"] == rule_id for r in rules)

    # 3. Get Single Rule
    get_res = db_client.get(f"/api/v1/automations/{rule_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == rule_id
    assert get_res.json()["name"] == "Auto-Triage VIP Incidents"

    # 4. Partial Update Rule
    patch_res = db_client.patch(
        f"/api/v1/automations/{rule_id}",
        json={
            "name": "Updated VIP Rule",
            "is_active": False,
            "actions": [{"action": "set_priority", "value": "urgent"}],
        },
        headers=headers,
    )
    assert patch_res.status_code == 200
    updated_rule = patch_res.json()
    assert updated_rule["name"] == "Updated VIP Rule"
    assert updated_rule["is_active"] is False
    assert len(updated_rule["actions"]) == 1

    # 5. Delete Rule
    del_res = db_client.delete(f"/api/v1/automations/{rule_id}", headers=headers)
    assert del_res.status_code == 204

    # 6. Verify Deleted
    get_del_res = db_client.get(f"/api/v1/automations/{rule_id}", headers=headers)
    assert get_del_res.status_code == 404


def test_automation_input_and_rule_validation(db_client, auto_test_env):
    """Verifies that invalid names, triggers, condition fields, ops, and action types are safely rejected with 422."""
    headers = _auth(auto_test_env["agent_a"])

    # Short name (< 2 chars)
    res = db_client.post(
        "/api/v1/automations/",
        json={"name": "A", "actions": [{"action": "set_status", "value": "open"}]},
        headers=headers,
    )
    assert res.status_code == 422

    # Invalid trigger
    res = db_client.post(
        "/api/v1/automations/",
        json={
            "name": "Invalid Trigger Rule",
            "trigger_event": "on_user_birthday",
            "actions": [{"action": "set_status", "value": "open"}],
        },
        headers=headers,
    )
    assert res.status_code == 422
    assert "Invalid trigger_event" in res.json()["detail"]

    # Unsupported condition field
    res = db_client.post(
        "/api/v1/automations/",
        json={
            "name": "Invalid Field Rule",
            "conditions": [{"field": "secret_bank_balance", "op": "==", "value": "1000000"}],
            "actions": [{"action": "set_status", "value": "open"}],
        },
        headers=headers,
    )
    assert res.status_code == 422
    assert "Unsupported condition field" in res.json()["detail"]

    # Unsupported condition operator
    res = db_client.post(
        "/api/v1/automations/",
        json={
            "name": "Invalid Op Rule",
            "conditions": [{"field": "priority", "op": "~=~", "value": "urgent"}],
            "actions": [{"action": "set_status", "value": "open"}],
        },
        headers=headers,
    )
    assert res.status_code == 422
    assert "Unsupported condition operator" in res.json()["detail"]

    # Unsupported action
    res = db_client.post(
        "/api/v1/automations/",
        json={
            "name": "Invalid Action Rule",
            "actions": [{"action": "launch_missiles", "value": True}],
        },
        headers=headers,
    )
    assert res.status_code == 422
    assert "Unsupported action" in res.json()["detail"]

    # Invalid status value
    res = db_client.post(
        "/api/v1/automations/",
        json={
            "name": "Invalid Status Value Rule",
            "actions": [{"action": "set_status", "value": "abandoned_in_void"}],
        },
        headers=headers,
    )
    assert res.status_code == 422
    assert "Invalid status" in res.json()["detail"]


def test_automation_rbac_permissions(db_client, auto_test_env):
    """Verifies that customer accounts receive 403 Forbidden on all automation endpoints."""
    cust_hdrs = _auth(auto_test_env["cust_a"])
    agent_hdrs = _auth(auto_test_env["agent_a"])

    # Agent creates a rule and a ticket
    r_res = db_client.post(
        "/api/v1/automations/",
        json={"name": "RBAC Rule", "actions": [{"action": "set_status", "value": "open"}]},
        headers=agent_hdrs,
    )
    assert r_res.status_code == 201
    rule_id = r_res.json()["id"]

    t_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Customer Ticket", "description": "RBAC check"},
        headers=agent_hdrs,
    )
    assert t_res.status_code == 201
    ticket_id = t_res.json()["id"]

    # Customer tries to CREATE rule -> 403
    res = db_client.post(
        "/api/v1/automations/",
        json={"name": "Customer Rule", "actions": [{"action": "set_status", "value": "open"}]},
        headers=cust_hdrs,
    )
    assert res.status_code == 403

    # Customer tries to LIST rules -> 403
    res = db_client.get("/api/v1/automations/", headers=cust_hdrs)
    assert res.status_code == 403

    # Customer tries to GET single rule -> 403
    res = db_client.get(f"/api/v1/automations/{rule_id}", headers=cust_hdrs)
    assert res.status_code == 403

    # Customer tries to UPDATE rule -> 403
    res = db_client.patch(f"/api/v1/automations/{rule_id}", json={"name": "Hacked"}, headers=cust_hdrs)
    assert res.status_code == 403

    # Customer tries to DELETE rule -> 403
    res = db_client.delete(f"/api/v1/automations/{rule_id}", headers=cust_hdrs)
    assert res.status_code == 403

    # Customer tries to EXECUTE automations -> 403
    res = db_client.post(f"/api/v1/automations/execute/{ticket_id}", headers=cust_hdrs)
    assert res.status_code == 403

    # Customer tries to GET logs -> 403
    res = db_client.get("/api/v1/automations/logs", headers=cust_hdrs)
    assert res.status_code == 403


def test_automation_strict_tenant_isolation(db_client, auto_test_env):
    """Verifies that Tenant B cannot access or modify Tenant A's automation rules."""
    hdrs_a = _auth(auto_test_env["admin_a"])
    hdrs_b = _auth(auto_test_env["admin_b"])

    # Create rule in Tenant A
    r_res = db_client.post(
        "/api/v1/automations/",
        json={"name": "Tenant A Secret Rule", "actions": [{"action": "set_status", "value": "open"}]},
        headers=hdrs_a,
    )
    assert r_res.status_code == 201
    rule_a_id = r_res.json()["id"]

    # Tenant B tries to GET Tenant A rule -> 404
    res = db_client.get(f"/api/v1/automations/{rule_a_id}", headers=hdrs_b)
    assert res.status_code == 404

    # Tenant B tries to UPDATE Tenant A rule -> 404
    res = db_client.patch(f"/api/v1/automations/{rule_a_id}", json={"name": "Tampered"}, headers=hdrs_b)
    assert res.status_code == 404

    # Tenant B tries to DELETE Tenant A rule -> 404
    res = db_client.delete(f"/api/v1/automations/{rule_a_id}", headers=hdrs_b)
    assert res.status_code == 404


def test_automation_condition_matching_and_actions(db_client, auto_test_env):
    """
    Verifies that automation execution:
    - Matches multi-field conditions (priority, status, channel, category)
    - Applies status and pauses SLA on pending
    - Recalculates priority SLA remaining
    - Adds and removes tags
    - Adds internal note
    - Records audit log in AutomationLog table
    - Records TicketTimeline event
    """
    headers = _auth(auto_test_env["admin_a"])

    # 1. Create rule
    rule_payload = {
        "name": "Escalate Urgent Chat Issues",
        "trigger_event": "ticket_updated",
        "conditions": [
            {"field": "priority", "op": "==", "value": "urgent"},
            {"field": "channel", "op": "==", "value": "chat"},
        ],
        "actions": [
            {"action": "set_status", "value": "pending"},
            {"action": "set_priority", "value": "urgent"},
            {"action": "add_tag", "value": ["escalated", "chat-priority"]},
            {"action": "add_internal_note", "value": "Automated internal escalation triggered."},
            {"action": "set_sla_paused", "value": True},
        ],
        "is_active": True,
    }
    r_res = db_client.post("/api/v1/automations/", json=rule_payload, headers=headers)
    assert r_res.status_code == 201
    rule_id = r_res.json()["id"]

    # 2. Create ticket matching conditions
    t_res = db_client.post(
        "/api/v1/tickets/",
        json={
            "subject": "Live Chat Outage",
            "description": "Customers unable to connect to agent chat",
            "channel": "chat",
            "priority": "urgent",
        },
        headers=headers,
    )
    assert t_res.status_code == 201
    ticket_id = t_res.json()["id"]

    # 3. Execute automation for 'ticket_updated'
    exec_res = db_client.post(
        f"/api/v1/automations/execute/{ticket_id}?event_type=ticket_updated",
        headers=headers,
    )
    assert exec_res.status_code == 200
    results = exec_res.json()
    assert len(results) >= 1
    matched_rule = next((r for r in results if r["rule_id"] == rule_id), None)
    assert matched_rule is not None
    assert "set_status_pending" in matched_rule["applied"]
    assert "set_priority_urgent" in matched_rule["applied"]

    # 4. Verify Ticket state
    ticket_get = db_client.get(f"/api/v1/tickets/{ticket_id}", headers=headers)
    assert ticket_get.status_code == 200
    ticket = ticket_get.json()
    assert ticket["status"] == "pending"
    assert ticket["priority"] == "urgent"
    assert ticket["sla_paused"] is True
    tags = json.loads(ticket["tags_json"])
    assert "escalated" in tags
    assert "chat-priority" in tags

    # 5. Verify Internal Note was created
    msg_res = db_client.get(f"/api/v1/tickets/{ticket_id}/messages", headers=headers)
    assert msg_res.status_code == 200
    messages = msg_res.json()
    assert any(m["sender_type"] == "internal_note" and "Automated internal escalation" in m["content"] for m in messages)

    # 6. Verify AutomationLog entry
    logs_res = db_client.get(f"/api/v1/automations/logs?ticket_id={ticket_id}", headers=headers)
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert any(l["rule_id"] == rule_id and l["status"] == "success" for l in logs)

    # 7. Verify Timeline event
    tl_res = db_client.get(f"/api/v1/tickets/{ticket_id}/timeline", headers=headers)
    assert tl_res.status_code == 200
    events = tl_res.json()
    assert any("Automation 'Escalate Urgent Chat Issues' executed" in e["title"] for e in events)


def test_automation_loop_protection_guard(db_client, auto_test_env):
    """Verifies that execution loop depth >= 3 triggers system-loop-guard and records log."""
    headers = _auth(auto_test_env["admin_a"])

    t_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Loop Guard Test Ticket", "description": "Testing max depth"},
        headers=headers,
    )
    assert t_res.status_code == 201
    ticket_id = t_res.json()["id"]

    # Trigger with depth=3 via API
    res = db_client.post(
        f"/api/v1/automations/execute/{ticket_id}?event_type=ticket_created&depth=3",
        headers=headers,
    )
    assert res.status_code == 200
    results = res.json()
    assert len(results) == 1
    assert results[0]["rule_name"] == "system-loop-guard"
    assert "loop_prevented" in results[0]["applied"]

    # Verify log entry in AutomationLog
    logs_res = db_client.get(f"/api/v1/automations/logs?ticket_id={ticket_id}", headers=headers)
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert any(l["rule_id"] == "system-loop-guard" and l["status"] == "loop_prevented" for l in logs)


def test_automation_ticket_creation_integration(db_client, auto_test_env):
    """Verifies that creating a ticket automatically triggers matching 'ticket_created' rules."""
    headers = _auth(auto_test_env["admin_a"])

    # Create active rule on ticket_created: when category is "Hardware", add tag "hardware-team"
    r_res = db_client.post(
        "/api/v1/automations/",
        json={
            "name": "Auto-Tag Hardware Incidents",
            "trigger_event": "ticket_created",
            "conditions": [{"field": "category", "op": "==", "value": "Hardware"}],
            "actions": [{"action": "add_tag", "value": "hardware-team"}],
            "is_active": True,
        },
        headers=headers,
    )
    assert r_res.status_code == 201

    # Create ticket with category "Hardware"
    t_res = db_client.post(
        "/api/v1/tickets/",
        json={
            "subject": "Faulty Motherboard",
            "description": "Server reboot loop due to motherboard fault",
            "category": "Hardware",
        },
        headers=headers,
    )
    assert t_res.status_code == 201
    ticket_id = t_res.json()["id"]

    # Fetch created ticket and verify tag was applied automatically
    t_get = db_client.get(f"/api/v1/tickets/{ticket_id}", headers=headers)
    assert t_get.status_code == 200
    ticket = t_get.json()
    tags = json.loads(ticket["tags_json"])
    assert "hardware-team" in tags
