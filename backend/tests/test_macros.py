"""
Unit and Integration Tests for Module 9: Macros
==============================================
Validates:
1. Macro CRUD Lifecycle (create, list, get, update, delete)
2. Macro Input & Action Validation (title, unsupported actions, status, priority, tags)
3. Role-Based Access Control (RBAC: Admin and Agent allowed, Customer 403 Forbidden)
4. Strict Tenant Isolation (cross-tenant get, update, delete, and apply rejected 404)
5. Ticket Macro Execution & Action Engine (customer reply, internal note, status, priority, tags, assignee)
6. Template Variable Interpolation ({{customer.name}}, {{ticket.subject}}, {{agent.name}})
7. Inactive and Missing Macro & Deleted Ticket Safeguards
"""
import pytest


@pytest.fixture
def macro_test_env(db_client):
    """
    Sets up two isolated workspaces:
    - Tenant A: 'macro-corp-a' with Admin, Agent, and Customer
    - Tenant B: 'macro-corp-b' with Admin
    """
    # Tenant A
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@macro-a.io",
            "name": "Macro Admin A",
            "password": "Password123!",
            "role": "admin",
            "tenant_slug": "macro-corp-a",
        },
    )
    admin_a_login = db_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@macro-a.io", "password": "Password123!", "tenant_slug": "macro-corp-a"},
    )
    token_admin_a = admin_a_login.json()["access_token"]

    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "agent@macro-a.io",
            "name": "Macro Agent A",
            "password": "Password123!",
            "role": "agent",
            "tenant_slug": "macro-corp-a",
        },
    )
    agent_a_login = db_client.post(
        "/api/v1/auth/login",
        json={"email": "agent@macro-a.io", "password": "Password123!", "tenant_slug": "macro-corp-a"},
    )
    token_agent_a = agent_a_login.json()["access_token"]

    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "customer@macro-a.io",
            "name": "Macro Customer A",
            "password": "Password123!",
            "role": "customer",
            "tenant_slug": "macro-corp-a",
        },
    )
    cust_a_login = db_client.post(
        "/api/v1/auth/login",
        json={"email": "customer@macro-a.io", "password": "Password123!", "tenant_slug": "macro-corp-a"},
    )
    token_cust_a = cust_a_login.json()["access_token"]

    # Tenant B
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@macro-b.io",
            "name": "Macro Admin B",
            "password": "Password123!",
            "role": "admin",
            "tenant_slug": "macro-corp-b",
        },
    )
    admin_b_login = db_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@macro-b.io", "password": "Password123!", "tenant_slug": "macro-corp-b"},
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


def test_macro_crud_lifecycle(db_client, macro_test_env):
    """Verifies complete CRUD operations: create, list, get, update, and delete."""
    headers = _auth(macro_test_env["admin_a"])

    # 1. Create Macro
    create_payload = {
        "title": "Initial Response & Triage",
        "description": "Send initial acknowledgment and triage to urgent",
        "actions": {
            "response_text": "Hello {{customer.name}}, we are investigating '{{ticket.subject}}'.",
            "status": "pending",
            "priority": "urgent",
            "tags": ["triage", "urgent-review"],
        },
        "is_active": True,
    }
    create_res = db_client.post("/api/v1/macros/", json=create_payload, headers=headers)
    assert create_res.status_code == 201
    macro_data = create_res.json()
    macro_id = macro_data["id"]
    assert macro_data["title"] == "Initial Response & Triage"
    assert macro_data["actions"]["status"] == "pending"
    assert macro_data["is_active"] is True

    # 2. List Macros
    list_res = db_client.get("/api/v1/macros/", headers=headers)
    assert list_res.status_code == 200
    macros = list_res.json()
    assert any(m["id"] == macro_id for m in macros)

    # 3. Get Single Macro
    get_res = db_client.get(f"/api/v1/macros/{macro_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == macro_id
    assert get_res.json()["title"] == "Initial Response & Triage"

    # 4. Partial Update Macro
    patch_res = db_client.patch(
        f"/api/v1/macros/{macro_id}",
        json={
            "title": "Updated Triage Macro",
            "actions": {
                "response_text": "Greetings {{customer.name}}, our engineering team is on it.",
                "status": "open",
            },
            "is_active": False,
        },
        headers=headers,
    )
    assert patch_res.status_code == 200
    updated_data = patch_res.json()
    assert updated_data["title"] == "Updated Triage Macro"
    assert updated_data["is_active"] is False
    assert updated_data["actions"]["status"] == "open"

    # 5. Delete Macro
    del_res = db_client.delete(f"/api/v1/macros/{macro_id}", headers=headers)
    assert del_res.status_code == 204

    # 6. Verify Deleted
    get_del_res = db_client.get(f"/api/v1/macros/{macro_id}", headers=headers)
    assert get_del_res.status_code == 404


def test_macro_action_and_input_validation(db_client, macro_test_env):
    """Verifies that invalid titles, actions, statuses, priorities, and tags are safely rejected with 422."""
    headers = _auth(macro_test_env["agent_a"])

    # Short title (< 2 chars)
    res = db_client.post(
        "/api/v1/macros/",
        json={"title": "A", "actions": {"response_text": "Hi"}},
        headers=headers,
    )
    assert res.status_code == 422

    # Unsupported action key
    res = db_client.post(
        "/api/v1/macros/",
        json={"title": "Invalid Action Key", "actions": {"execute_shell": "rm -rf /"}},
        headers=headers,
    )
    assert res.status_code == 422
    assert "Unsupported macro action" in res.json()["detail"]

    # Invalid status
    res = db_client.post(
        "/api/v1/macros/",
        json={"title": "Invalid Status", "actions": {"status": "in_limbo"}},
        headers=headers,
    )
    assert res.status_code == 422
    assert "Invalid status" in res.json()["detail"]

    # Invalid priority
    res = db_client.post(
        "/api/v1/macros/",
        json={"title": "Invalid Priority", "actions": {"priority": "apocalyptic"}},
        headers=headers,
    )
    assert res.status_code == 422
    assert "Invalid priority" in res.json()["detail"]

    # Invalid tags (not list of strings)
    res = db_client.post(
        "/api/v1/macros/",
        json={"title": "Invalid Tags", "actions": {"tags": "just_a_string"}},
        headers=headers,
    )
    assert res.status_code == 422
    assert "Action 'tags' must be a list" in res.json()["detail"]


def test_macro_rbac_permissions(db_client, macro_test_env):
    """Verifies that customers receive 403 Forbidden on all macro operations."""
    cust_headers = _auth(macro_test_env["cust_a"])
    agent_headers = _auth(macro_test_env["agent_a"])

    # Create a valid macro as agent
    create_res = db_client.post(
        "/api/v1/macros/",
        json={"title": "RBAC Macro", "actions": {"status": "open"}},
        headers=agent_headers,
    )
    assert create_res.status_code == 201
    macro_id = create_res.json()["id"]

    # Create a ticket as customer
    ticket_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Customer Query", "description": "Needs assistance"},
        headers=cust_headers,
    )
    assert ticket_res.status_code == 201
    ticket_id = ticket_res.json()["id"]

    # Customer tries to CREATE macro -> 403
    res = db_client.post(
        "/api/v1/macros/",
        json={"title": "Hacker Macro", "actions": {"status": "closed"}},
        headers=cust_headers,
    )
    assert res.status_code == 403

    # Customer tries to LIST macros -> 403
    res = db_client.get("/api/v1/macros/", headers=cust_headers)
    assert res.status_code == 403

    # Customer tries to GET single macro -> 403
    res = db_client.get(f"/api/v1/macros/{macro_id}", headers=cust_headers)
    assert res.status_code == 403

    # Customer tries to UPDATE macro -> 403
    res = db_client.patch(
        f"/api/v1/macros/{macro_id}",
        json={"title": "Hacked Title"},
        headers=cust_headers,
    )
    assert res.status_code == 403

    # Customer tries to DELETE macro -> 403
    res = db_client.delete(f"/api/v1/macros/{macro_id}", headers=cust_headers)
    assert res.status_code == 403

    # Customer tries to APPLY macro -> 403
    res = db_client.post(f"/api/v1/macros/{macro_id}/apply/{ticket_id}", headers=cust_headers)
    assert res.status_code == 403


def test_macro_strict_tenant_isolation(db_client, macro_test_env):
    """Verifies that Tenant B cannot read, update, delete, or execute Tenant A's macros."""
    hdrs_a = _auth(macro_test_env["admin_a"])
    hdrs_b = _auth(macro_test_env["admin_b"])

    # Create macro and ticket in Tenant A
    m_res = db_client.post(
        "/api/v1/macros/",
        json={"title": "Secret Macro Tenant A", "actions": {"response_text": "Confidential A"}},
        headers=hdrs_a,
    )
    assert m_res.status_code == 201
    macro_a_id = m_res.json()["id"]

    t_res_a = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Tenant A Ticket", "description": "Desc A"},
        headers=hdrs_a,
    )
    ticket_a_id = t_res_a.json()["id"]

    # Create ticket in Tenant B
    t_res_b = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Tenant B Ticket", "description": "Desc B"},
        headers=hdrs_b,
    )
    ticket_b_id = t_res_b.json()["id"]

    # Tenant B tries to GET Tenant A macro -> 404
    get_res = db_client.get(f"/api/v1/macros/{macro_a_id}", headers=hdrs_b)
    assert get_res.status_code == 404

    # Tenant B tries to UPDATE Tenant A macro -> 404
    patch_res = db_client.patch(
        f"/api/v1/macros/{macro_a_id}",
        json={"title": "Tampered By B"},
        headers=hdrs_b,
    )
    assert patch_res.status_code == 404

    # Tenant B tries to DELETE Tenant A macro -> 404
    del_res = db_client.delete(f"/api/v1/macros/{macro_a_id}", headers=hdrs_b)
    assert del_res.status_code == 404

    # Tenant B tries to apply Tenant A macro to Tenant B ticket -> 404
    apply_res_1 = db_client.post(f"/api/v1/macros/{macro_a_id}/apply/{ticket_b_id}", headers=hdrs_b)
    assert apply_res_1.status_code == 404

    # Tenant A tries to apply Tenant A macro to Tenant B ticket -> 404
    apply_res_2 = db_client.post(f"/api/v1/macros/{macro_a_id}/apply/{ticket_b_id}", headers=hdrs_a)
    assert apply_res_2.status_code == 404


def test_macro_action_execution_and_template_interpolation(db_client, macro_test_env):
    """
    Verifies that applying a macro:
    - Renders {{customer.name}}, {{ticket.subject}}, {{agent.name}} templates into reply
    - Adds an internal note
    - Updates ticket status and handles SLA timer
    - Recalculates priority
    - Merges tags into tags_json
    - Logs a timeline audit event
    """
    agent_hdrs = _auth(macro_test_env["agent_a"])
    admin_hdrs = _auth(macro_test_env["admin_a"])

    # 1. Create Macro with multiple supported actions
    macro_payload = {
        "title": "Comprehensive Macro Execution",
        "description": "Applies reply, note, tags, status, and priority",
        "actions": {
            "response_text": "Dear {{customer.name}},\nRegarding '{{ticket.subject}}', agent {{agent.name}} is resolving this.",
            "internal_note": "Internal verification completed by {{agent.name}}.",
            "status": "pending",
            "priority": "high",
            "tags": ["escalated", "tier2"],
        },
        "is_active": True,
    }
    macro_res = db_client.post("/api/v1/macros/", json=macro_payload, headers=admin_hdrs)
    assert macro_res.status_code == 201
    macro_id = macro_res.json()["id"]

    # 2. Create ticket with initial tags and low priority
    ticket_res = db_client.post(
        "/api/v1/tickets/",
        json={
            "subject": "Billing Gateway Timeout",
            "description": "Payment was debited but subscription not activated",
            "priority": "low",
        },
        headers=agent_hdrs,
    )
    assert ticket_res.status_code == 201
    ticket_id = ticket_res.json()["id"]

    # 3. Apply Macro as Agent A
    apply_res = db_client.post(f"/api/v1/macros/{macro_id}/apply/{ticket_id}", headers=agent_hdrs)
    assert apply_res.status_code == 200
    apply_data = apply_res.json()
    assert apply_data["success"] is True
    assert "added_customer_reply" in apply_data["applied_actions"]
    assert "added_internal_note" in apply_data["applied_actions"]
    assert "status_changed_to_pending" in apply_data["applied_actions"]
    assert "priority_changed_to_high" in apply_data["applied_actions"]
    assert "tags_updated" in apply_data["applied_actions"]

    # 4. Verify Ticket state
    ticket_get = db_client.get(f"/api/v1/tickets/{ticket_id}", headers=agent_hdrs)
    assert ticket_get.status_code == 200
    ticket = ticket_get.json()
    assert ticket["status"] == "pending"
    assert ticket["priority"] == "high"
    assert ticket["sla_paused"] is True
    import json
    tags = json.loads(ticket["tags_json"])
    assert "escalated" in tags
    assert "tier2" in tags

    # 5. Verify Messages (Reply and Internal Note)
    msg_res = db_client.get(f"/api/v1/tickets/{ticket_id}/messages", headers=agent_hdrs)
    assert msg_res.status_code == 200
    messages = msg_res.json()
    reply_msg = next((m for m in messages if m["sender_type"] == "agent"), None)
    note_msg = next((m for m in messages if m["sender_type"] == "internal_note"), None)

    assert reply_msg is not None
    assert "Billing Gateway Timeout" in reply_msg["content"]
    assert "Macro Agent A" in reply_msg["content"]

    assert note_msg is not None
    assert "Macro Agent A" in note_msg["content"]

    # 6. Verify Timeline event
    tl_res = db_client.get(f"/api/v1/tickets/{ticket_id}/timeline", headers=agent_hdrs)
    assert tl_res.status_code == 200
    timeline_events = tl_res.json()
    assert any("Applied Macro: 'Comprehensive Macro Execution'" in e["title"] for e in timeline_events)


def test_inactive_macro_and_deleted_ticket_safeguards(db_client, macro_test_env):
    """Verifies that inactive macros cannot be executed and deleted tickets return 404."""
    agent_hdrs = _auth(macro_test_env["agent_a"])

    # Create inactive macro
    m_res = db_client.post(
        "/api/v1/macros/",
        json={"title": "Inactive Macro", "actions": {"status": "resolved"}, "is_active": False},
        headers=agent_hdrs,
    )
    assert m_res.status_code == 201
    inactive_macro_id = m_res.json()["id"]

    # Create ticket
    t_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Safeguards Ticket", "description": "Testing edge cases"},
        headers=agent_hdrs,
    )
    assert t_res.status_code == 201
    ticket_id = t_res.json()["id"]

    # Attempt to apply inactive macro -> 400
    apply_res = db_client.post(f"/api/v1/macros/{inactive_macro_id}/apply/{ticket_id}", headers=agent_hdrs)
    assert apply_res.status_code == 400
    assert "Cannot apply inactive macro" in apply_res.json()["detail"]

    # Soft-delete ticket
    del_t_res = db_client.delete(f"/api/v1/tickets/{ticket_id}", headers=agent_hdrs)
    assert del_t_res.status_code == 200

    # Create an active macro
    act_res = db_client.post(
        "/api/v1/macros/",
        json={"title": "Active Macro", "actions": {"status": "open"}, "is_active": True},
        headers=agent_hdrs,
    )
    active_macro_id = act_res.json()["id"]

    # Attempt to apply macro to soft-deleted ticket -> 404
    del_apply_res = db_client.post(f"/api/v1/macros/{active_macro_id}/apply/{ticket_id}", headers=agent_hdrs)
    assert del_apply_res.status_code == 404
    assert "Ticket not found" in del_apply_res.json()["detail"]
