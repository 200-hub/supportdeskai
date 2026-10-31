import pytest


@pytest.fixture
def agent_token(db_client):
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "workflow.agent@cyberdyne.org",
            "name": "Workflow Agent",
            "password": "Password123!",
            "role": "agent",
            "tenant_slug": "workflow-tenant",
        },
    )
    res = db_client.post(
        "/api/v1/auth/login",
        json={"email": "workflow.agent@cyberdyne.org", "password": "Password123!", "tenant_slug": "workflow-tenant"},
    )
    return res.json()["access_token"]


def test_tenants_slug_and_branding(db_client, agent_token):
    # Check slug availability
    res_avail = db_client.get("/api/v1/tenants/check-slug?slug=brand-new-org")
    assert res_avail.status_code == 200
    assert res_avail.json()["is_available"] is True

    # Existing slug check
    res_taken = db_client.get("/api/v1/tenants/check-slug?slug=workflow-tenant")
    assert res_taken.status_code == 200
    assert res_taken.json()["is_available"] is False

    # Update workspace branding
    headers = {"Authorization": f"Bearer {agent_token}"}
    patch_res = db_client.patch(
        "/api/v1/tenants/current",
        json={"name": "Cyberdyne Systems Global", "plan": "Enterprise"},
        headers=headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Cyberdyne Systems Global"

    # Get current workspace
    get_res = db_client.get("/api/v1/tenants/current", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Cyberdyne Systems Global"


def test_user_invitations_and_acceptance(db_client, agent_token):
    headers = {"Authorization": f"Bearer {agent_token}"}

    # Invite user
    invite_res = db_client.post(
        "/api/v1/tenants/invite",
        json={"email": "new.recruit@cyberdyne.org", "role": "agent"},
        headers=headers,
    )
    assert invite_res.status_code == 201
    invites = invite_res.json()
    assert len(invites) == 1
    token = invites[0]["invitation_token"]

    # Accept invitation
    accept_res = db_client.post(
        f"/api/v1/tenants/invitations/{token}/accept",
        json={"name": "New Recruit", "password": "SecurePassword999!"},
    )
    assert accept_res.status_code == 200
    user_data = accept_res.json()
    assert user_data["email"] == "new.recruit@cyberdyne.org"
    assert user_data["name"] == "New Recruit"


def test_sla_policy_and_evaluation(db_client, agent_token):
    headers = {"Authorization": f"Bearer {agent_token}"}

    # 1. Create custom SLA policy
    policy_res = db_client.post(
        "/api/v1/sla/policies",
        json={
            "name": "Critical Incidents SLA",
            "priority": "urgent",
            "first_response_time_minutes": 10,
            "resolution_time_minutes": 60,
        },
        headers=headers,
    )
    assert policy_res.status_code == 201

    # Update SLA policy
    policy_id = policy_res.json()["id"]
    patch_policy_res = db_client.patch(
        f"/api/v1/sla/policies/{policy_id}",
        json={
            "name": "Updated Critical Incidents SLA",
            "priority": "urgent",
            "first_response_time_minutes": 15,
            "resolution_time_minutes": 120,
        },
        headers=headers,
    )
    assert patch_policy_res.status_code == 200
    assert patch_policy_res.json()["first_response_time_minutes"] == 15

    # 2. Create ticket with urgent priority
    ticket_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "SLA Evaluation Target", "description": "Needs rapid response", "priority": "urgent"},
        headers=headers,
    )
    ticket_id = ticket_res.json()["id"]

    # 3. Evaluate SLA
    eval_res = db_client.post(f"/api/v1/sla/evaluate/{ticket_id}", headers=headers)
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    assert eval_data["priority"] == "urgent"
    assert eval_data["sla_status"] in ["safe", "at-risk", "breached"]


def test_routing_rules_and_assignment(db_client, agent_token):
    headers = {"Authorization": f"Bearer {agent_token}"}

    # Create routing rule
    rule_res = db_client.post(
        "/api/v1/routing/rules",
        json={"name": "Round Robin Intake", "strategy": "round_robin", "priority_order": 1},
        headers=headers,
    )
    assert rule_res.status_code == 201

    # Update active routing strategy
    strat_res = db_client.patch(
        "/api/v1/routing/active-strategy?strategy=least_loaded",
        headers=headers,
    )
    assert strat_res.status_code == 200
    assert strat_res.json()["strategy"] == "least_loaded"

    # Create ticket
    ticket_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Unassigned Inquiry", "description": "Needs routing"},
        headers=headers,
    )
    ticket_id = ticket_res.json()["id"]

    # Assign ticket via routing engine
    assign_res = db_client.post(f"/api/v1/routing/assign/{ticket_id}", headers=headers)
    assert assign_res.status_code == 200
    assert assign_res.json()["assigned_to_id"] is not None


def test_macros_canned_responses(db_client, agent_token):
    headers = {"Authorization": f"Bearer {agent_token}"}

    # Create Macro
    macro_res = db_client.post(
        "/api/v1/macros/",
        json={
            "title": "Resolve with thanks",
            "description": "Close ticket with custom thank you template",
            "actions": {
                "response_text": "Hi {{customer.name}}, thank you for contacting support regarding {{ticket.subject}}.",
                "status": "resolved",
            },
        },
        headers=headers,
    )
    assert macro_res.status_code == 201
    macro_id = macro_res.json()["id"]

    # Create Ticket
    ticket_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Printer Malfunction", "description": "Paper jam"},
        headers=headers,
    )
    ticket_id = ticket_res.json()["id"]

    # Apply Macro
    apply_res = db_client.post(f"/api/v1/macros/{macro_id}/apply/{ticket_id}", headers=headers)
    assert apply_res.status_code == 200
    apply_data = apply_res.json()
    assert apply_data["success"] is True

    # Verify ticket status updated to resolved
    get_res = db_client.get(f"/api/v1/tickets/{ticket_id}", headers=headers)
    assert get_res.json()["status"] == "resolved"


def test_automations_triggers_and_loop_guard(db_client, agent_token):
    headers = {"Authorization": f"Bearer {agent_token}"}

    # Create Automation Rule: When priority is urgent, set status to open
    auto_res = db_client.post(
        "/api/v1/automations/",
        json={
            "name": "Auto-open Urgent Incidents",
            "trigger_event": "ticket_created",
            "conditions": [{"field": "priority", "op": "==", "value": "urgent"}],
            "actions": [{"action": "set_status", "value": "open"}],
        },
        headers=headers,
    )
    assert auto_res.status_code == 201

    # Create ticket
    ticket_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Outage Alert", "description": "Database lock", "priority": "urgent"},
        headers=headers,
    )
    ticket_id = ticket_res.json()["id"]

    # Execute automations for event
    exec_res = db_client.post(
        f"/api/v1/automations/execute/{ticket_id}?event_type=ticket_created",
        headers=headers,
    )
    assert exec_res.status_code == 200
    exec_data = exec_res.json()
    assert len(exec_data) >= 1
    assert "set_status_open" in exec_data[0]["applied"]


def test_ticket_soft_delete_restore_merge_collision(db_client, agent_token):
    headers = {"Authorization": f"Bearer {agent_token}"}

    # Create Ticket 1 and Ticket 2
    t1_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Ticket A to be merged", "description": "Source inquiry"},
        headers=headers,
    )
    t1_id = t1_res.json()["id"]

    t2_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Ticket B destination", "description": "Target inquiry"},
        headers=headers,
    )
    t2_id = t2_res.json()["id"]

    # Collision reporting
    col_res = db_client.post(f"/api/v1/tickets/{t1_id}/collision?is_typing=true", headers=headers)
    assert col_res.status_code == 200
    assert col_res.json()["agent_name"] == "Workflow Agent"

    # Merge T1 into T2
    merge_res = db_client.post(f"/api/v1/tickets/{t1_id}/merge/{t2_id}", headers=headers)
    assert merge_res.status_code == 200
    assert merge_res.json()["id"] == t2_id

    # Soft delete T2
    del_res = db_client.delete(f"/api/v1/tickets/{t2_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["is_deleted"] is True

    # Restore T2
    restore_res = db_client.post(f"/api/v1/tickets/{t2_id}/restore", headers=headers)
    assert restore_res.status_code == 200
    assert restore_res.json()["is_deleted"] is False

