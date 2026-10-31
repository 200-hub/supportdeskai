import pytest


@pytest.fixture
def auth_tokens(db_client):
    # Register customer
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "cust1@acme.com",
            "name": "Customer One",
            "password": "Password123!",
            "role": "customer",
            "tenant_slug": "acme-tenant",
        },
    )
    cust_res = db_client.post(
        "/api/v1/auth/login",
        json={"email": "cust1@acme.com", "password": "Password123!", "tenant_slug": "acme-tenant"},
    )
    cust_token = cust_res.json()["access_token"]

    # Register agent
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "agent1@acme.com",
            "name": "Agent One",
            "password": "Password123!",
            "role": "agent",
            "tenant_slug": "acme-tenant",
        },
    )
    agent_res = db_client.post(
        "/api/v1/auth/login",
        json={"email": "agent1@acme.com", "password": "Password123!", "tenant_slug": "acme-tenant"},
    )
    agent_token = agent_res.json()["access_token"]

    # Register user in different tenant
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "other@diff.com",
            "name": "Other Tenant User",
            "password": "Password123!",
            "role": "customer",
            "tenant_slug": "diff-tenant",
        },
    )
    other_res = db_client.post(
        "/api/v1/auth/login",
        json={"email": "other@diff.com", "password": "Password123!", "tenant_slug": "diff-tenant"},
    )
    other_token = other_res.json()["access_token"]

    # Register admin in acme-tenant
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin1@acme.com",
            "name": "Admin One",
            "password": "Password123!",
            "role": "admin",
            "tenant_slug": "acme-tenant",
        },
    )
    admin_res = db_client.post(
        "/api/v1/auth/login",
        json={"email": "admin1@acme.com", "password": "Password123!", "tenant_slug": "acme-tenant"},
    )
    admin_token = admin_res.json()["access_token"]

    # Register agent in diff-tenant
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "diffagent@diff.com",
            "name": "Diff Agent",
            "password": "Password123!",
            "role": "agent",
            "tenant_slug": "diff-tenant",
        },
    )
    diff_agent_res = db_client.post(
        "/api/v1/auth/login",
        json={"email": "diffagent@diff.com", "password": "Password123!", "tenant_slug": "diff-tenant"},
    )
    diff_agent_token = diff_agent_res.json()["access_token"]

    return {
        "customer": cust_token,
        "agent": agent_token,
        "admin": admin_token,
        "other_tenant": other_token,
        "diff_agent": diff_agent_token,
    }


def test_create_and_view_ticket(db_client, auth_tokens):
    headers = {"Authorization": f"Bearer {auth_tokens['customer']}"}

    # 1. Customer creates ticket
    create_payload = {
        "subject": "Payment webhook timeout issue",
        "description": "Our server received 504 Gateway Timeout during webhook execution.",
        "category": "Billing & Invoices",
        "channel": "web",
        "priority": "urgent",
    }
    res = db_client.post("/api/v1/tickets/", json=create_payload, headers=headers)
    assert res.status_code == 201
    ticket = res.json()
    ticket_id = ticket["id"]
    assert ticket["subject"] == "Payment webhook timeout issue"
    assert ticket["status"] == "open"
    assert ticket["priority"] == "urgent"

    # 2. Customer lists tickets
    list_res = db_client.get("/api/v1/tickets/", headers=headers)
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1
    assert any(t["id"] == ticket_id for t in list_data["tickets"])

    # 3. Customer views ticket details
    get_res = db_client.get(f"/api/v1/tickets/{ticket_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == ticket_id


def test_ticket_messaging_and_internal_notes(db_client, auth_tokens):
    cust_headers = {"Authorization": f"Bearer {auth_tokens['customer']}"}
    agent_headers = {"Authorization": f"Bearer {auth_tokens['agent']}"}

    # Customer creates ticket
    res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Bug report", "description": "Button is unresponsive on Safari", "priority": "medium"},
        headers=cust_headers,
    )
    ticket_id = res.json()["id"]

    # Customer posts customer message
    msg_res = db_client.post(
        f"/api/v1/tickets/{ticket_id}/messages",
        json={"content": "Here is an extra screenshot link.", "sender_type": "customer"},
        headers=cust_headers,
    )
    assert msg_res.status_code == 201

    # Customer attempts to post internal note (must be forbidden)
    fail_res = db_client.post(
        f"/api/v1/tickets/{ticket_id}/messages",
        json={"content": "Secret note", "sender_type": "internal_note"},
        headers=cust_headers,
    )
    assert fail_res.status_code == 403

    # Agent posts internal note
    agent_msg_res = db_client.post(
        f"/api/v1/tickets/{ticket_id}/messages",
        json={"content": "Internal diagnosis: Safari WebKit bug in flexbox.", "sender_type": "internal_note"},
        headers=agent_headers,
    )
    assert agent_msg_res.status_code == 201

    # Customer fetches messages: internal note should be filtered out
    cust_msgs_res = db_client.get(f"/api/v1/tickets/{ticket_id}/messages", headers=cust_headers)
    assert cust_msgs_res.status_code == 200
    cust_msgs = cust_msgs_res.json()
    assert not any(m["sender_type"] == "internal_note" for m in cust_msgs)

    # Agent fetches messages: internal note is present
    agent_msgs_res = db_client.get(f"/api/v1/tickets/{ticket_id}/messages", headers=agent_headers)
    assert agent_msgs_res.status_code == 200
    agent_msgs = agent_msgs_res.json()
    assert any(m["sender_type"] == "internal_note" for m in agent_msgs)


def test_agent_update_ticket_status_and_permissions(db_client, auth_tokens):
    cust_headers = {"Authorization": f"Bearer {auth_tokens['customer']}"}
    agent_headers = {"Authorization": f"Bearer {auth_tokens['agent']}"}

    res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "SLA policy check", "description": "Verifying ticket update logic."},
        headers=cust_headers,
    )
    ticket_id = res.json()["id"]

    # Customer tries to change priority -> 403
    patch_fail = db_client.patch(
        f"/api/v1/tickets/{ticket_id}",
        json={"priority": "urgent"},
        headers=cust_headers,
    )
    assert patch_fail.status_code == 403

    # Agent updates status to resolved
    patch_agent = db_client.patch(
        f"/api/v1/tickets/{ticket_id}",
        json={"status": "resolved", "priority": "high"},
        headers=agent_headers,
    )
    assert patch_agent.status_code == 200
    assert patch_agent.json()["status"] == "resolved"
    assert patch_agent.json()["priority"] == "high"


def test_tenant_isolation(db_client, auth_tokens):
    cust_headers = {"Authorization": f"Bearer {auth_tokens['customer']}"}
    other_tenant_headers = {"Authorization": f"Bearer {auth_tokens['other_tenant']}"}

    # Ticket created by Acme customer
    res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Confidential Acme Inquiries", "description": "Super private data."},
        headers=cust_headers,
    )
    ticket_id = res.json()["id"]

    # User from Diff-Tenant attempts to view it -> 404 (isolated)
    other_res = db_client.get(f"/api/v1/tickets/{ticket_id}", headers=other_tenant_headers)
    assert other_res.status_code == 404


def test_ticket_validation_input(db_client, auth_tokens):
    headers = {"Authorization": f"Bearer {auth_tokens['customer']}"}
    agent_headers = {"Authorization": f"Bearer {auth_tokens['agent']}"}

    # 1. Subject too short -> 422
    res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": " ", "description": "Valid issue description here"},
        headers=headers,
    )
    assert res.status_code == 422

    # 2. Description too short -> 422
    res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Valid Subject", "description": " "},
        headers=headers,
    )
    assert res.status_code == 422

    # 3. Create valid ticket
    create_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Validation Test Ticket", "description": "Legitimate content details"},
        headers=headers,
    )
    assert create_res.status_code == 201
    tid = create_res.json()["id"]

    # 4. Agent attempts to set invalid tags_json (not valid JSON array) -> 422
    patch_tag_fail = db_client.patch(
        f"/api/v1/tickets/{tid}",
        json={"tags_json": "not-valid-json"},
        headers=agent_headers,
    )
    assert patch_tag_fail.status_code == 422

    # 5. Agent sets valid tags_json
    patch_tag_ok = db_client.patch(
        f"/api/v1/tickets/{tid}",
        json={"tags_json": '["billing", "p1"]'},
        headers=agent_headers,
    )
    assert patch_tag_ok.status_code == 200
    assert patch_tag_ok.json()["tags_json"] == '["billing", "p1"]'


def test_ticket_soft_delete_restore_spam_rbac(db_client, auth_tokens):
    cust_headers = {"Authorization": f"Bearer {auth_tokens['customer']}"}
    agent_headers = {"Authorization": f"Bearer {auth_tokens['agent']}"}

    # Create ticket as customer
    res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "RBAC Test Ticket", "description": "Testing permissions on operations"},
        headers=cust_headers,
    )
    tid = res.json()["id"]

    # Customer tries to soft-delete -> 403
    del_cust = db_client.delete(f"/api/v1/tickets/{tid}", headers=cust_headers)
    assert del_cust.status_code == 403

    # Customer tries to restore -> 403
    restore_cust = db_client.post(f"/api/v1/tickets/{tid}/restore", headers=cust_headers)
    assert restore_cust.status_code == 403

    # Customer tries to mark spam -> 403
    spam_cust = db_client.post(f"/api/v1/tickets/{tid}/spam", headers=cust_headers)
    assert spam_cust.status_code == 403

    # Agent soft-deletes -> 200
    del_agent = db_client.delete(f"/api/v1/tickets/{tid}", headers=agent_headers)
    assert del_agent.status_code == 200
    assert del_agent.json()["is_deleted"] is True

    # Agent restores -> 200
    restore_agent = db_client.post(f"/api/v1/tickets/{tid}/restore", headers=agent_headers)
    assert restore_agent.status_code == 200
    assert restore_agent.json()["is_deleted"] is False

    # Agent marks spam -> 200
    spam_agent = db_client.post(f"/api/v1/tickets/{tid}/spam", headers=agent_headers)
    assert spam_agent.status_code == 200
    assert spam_agent.json()["is_spam"] is True
    assert spam_agent.json()["status"] == "closed"


def test_ticket_merge_rbac_and_validation(db_client, auth_tokens):
    cust_headers = {"Authorization": f"Bearer {auth_tokens['customer']}"}
    agent_headers = {"Authorization": f"Bearer {auth_tokens['agent']}"}
    diff_headers = {"Authorization": f"Bearer {auth_tokens['diff_agent']}"}

    # Create ticket 1 and ticket 2 in acme-tenant
    t1_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Source Ticket", "description": "Source inquiry body"},
        headers=agent_headers,
    )
    t1_id = t1_res.json()["id"]

    t2_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Target Ticket", "description": "Target inquiry body"},
        headers=agent_headers,
    )
    t2_id = t2_res.json()["id"]

    # Customer attempts to merge -> 403
    merge_cust = db_client.post(f"/api/v1/tickets/{t1_id}/merge/{t2_id}", headers=cust_headers)
    assert merge_cust.status_code == 403

    # Agent attempts to merge ticket into itself -> 400
    self_merge = db_client.post(f"/api/v1/tickets/{t1_id}/merge/{t1_id}", headers=agent_headers)
    assert self_merge.status_code == 400

    # Create ticket in diff tenant
    diff_t = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Diff Tenant Ticket", "description": "Inquiry in other tenant"},
        headers=diff_headers,
    )
    diff_tid = diff_t.json()["id"]

    # Agent attempts to merge cross-tenant tickets -> 404
    cross_merge = db_client.post(f"/api/v1/tickets/{t1_id}/merge/{diff_tid}", headers=agent_headers)
    assert cross_merge.status_code == 404

    # Agent merges t1 into t2 -> 200
    merge_ok = db_client.post(f"/api/v1/tickets/{t1_id}/merge/{t2_id}", headers=agent_headers)
    assert merge_ok.status_code == 200
    assert merge_ok.json()["id"] == t2_id


def test_ticket_update_team_assignment_and_cross_tenant(db_client, auth_tokens):
    admin_headers = {"Authorization": f"Bearer {auth_tokens['admin']}"}
    agent_headers = {"Authorization": f"Bearer {auth_tokens['agent']}"}
    cust_headers = {"Authorization": f"Bearer {auth_tokens['customer']}"}

    # 1. Create team in acme-tenant
    team_acme_res = db_client.post(
        "/api/v1/teams/",
        json={"name": "Acme Support Team", "description": "Handles tier 1 issues"},
        headers=admin_headers,
    )
    assert team_acme_res.status_code == 201
    acme_team_id = team_acme_res.json()["id"]

    # 2. Create ticket in acme-tenant
    t_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Team Assignment Ticket", "description": "Route to proper team"},
        headers=agent_headers,
    )
    tid = t_res.json()["id"]

    # 3. Customer attempts to assign team -> 403
    cust_patch = db_client.patch(
        f"/api/v1/tickets/{tid}",
        json={"team_id": acme_team_id},
        headers=cust_headers,
    )
    assert cust_patch.status_code == 403

    # 4. Agent assigns valid same-tenant team -> 200
    agent_patch = db_client.patch(
        f"/api/v1/tickets/{tid}",
        json={"team_id": acme_team_id},
        headers=agent_headers,
    )
    assert agent_patch.status_code == 200
    assert agent_patch.json()["team_id"] == acme_team_id

    # 5. Agent attempts to assign fake/non-existent or other-tenant team -> 404
    fake_patch = db_client.patch(
        f"/api/v1/tickets/{tid}",
        json={"team_id": "non-existent-team-id"},
        headers=agent_headers,
    )
    assert fake_patch.status_code == 404


def test_ticket_sla_pause_rbac(db_client, auth_tokens):
    cust_headers = {"Authorization": f"Bearer {auth_tokens['customer']}"}
    agent_headers = {"Authorization": f"Bearer {auth_tokens['agent']}"}

    res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "SLA Pause Ticket", "description": "Need to pause SLA timer for pending customer response"},
        headers=cust_headers,
    )
    tid = res.json()["id"]

    # Customer tries to pause SLA -> 403
    cust_fail = db_client.patch(
        f"/api/v1/tickets/{tid}",
        json={"sla_paused": True},
        headers=cust_headers,
    )
    assert cust_fail.status_code == 403

    # Agent pauses SLA -> 200
    agent_pause = db_client.patch(
        f"/api/v1/tickets/{tid}",
        json={"sla_paused": True},
        headers=agent_headers,
    )
    assert agent_pause.status_code == 200
    assert agent_pause.json()["sla_paused"] is True

    # Agent unpauses SLA -> 200
    agent_resume = db_client.patch(
        f"/api/v1/tickets/{tid}",
        json={"sla_paused": False},
        headers=agent_headers,
    )
    assert agent_resume.status_code == 200
    assert agent_resume.json()["sla_paused"] is False


def test_ticket_timeline_endpoint(db_client, auth_tokens):
    cust_headers = {"Authorization": f"Bearer {auth_tokens['customer']}"}
    agent_headers = {"Authorization": f"Bearer {auth_tokens['agent']}"}
    other_headers = {"Authorization": f"Bearer {auth_tokens['other_tenant']}"}

    # Customer creates ticket
    res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Timeline Verification", "description": "Checking audit timeline log"},
        headers=cust_headers,
    )
    tid = res.json()["id"]

    # Agent updates ticket status to generate another timeline event
    db_client.patch(
        f"/api/v1/tickets/{tid}",
        json={"status": "pending"},
        headers=agent_headers,
    )

    # Customer views timeline -> 200
    cust_tl = db_client.get(f"/api/v1/tickets/{tid}/timeline", headers=cust_headers)
    assert cust_tl.status_code == 200
    tl_events = cust_tl.json()
    assert len(tl_events) >= 2
    assert any("opened" in e["title"].lower() for e in tl_events)

    # Cross-tenant customer attempts to view timeline -> 404
    other_tl = db_client.get(f"/api/v1/tickets/{tid}/timeline", headers=other_headers)
    assert other_tl.status_code == 404


def test_ticket_customer_get_filters_internal_notes(db_client, auth_tokens):
    cust_headers = {"Authorization": f"Bearer {auth_tokens['customer']}"}
    agent_headers = {"Authorization": f"Bearer {auth_tokens['agent']}"}

    # Customer creates ticket
    res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Internal Note Masking", "description": "Customer inquiry"},
        headers=cust_headers,
    )
    tid = res.json()["id"]

    # Agent adds internal note
    db_client.post(
        f"/api/v1/tickets/{tid}/messages",
        json={"content": "Top secret agent troubleshooting note", "sender_type": "internal_note"},
        headers=agent_headers,
    )

    # Customer fetches single ticket via GET /api/v1/tickets/{id}
    cust_get = db_client.get(f"/api/v1/tickets/{tid}", headers=cust_headers)
    assert cust_get.status_code == 200
    cust_ticket = cust_get.json()
    assert not any(m["sender_type"] == "internal_note" for m in cust_ticket["messages"])

    # Agent fetches single ticket -> internal note is visible
    agent_get = db_client.get(f"/api/v1/tickets/{tid}", headers=agent_headers)
    assert agent_get.status_code == 200
    agent_ticket = agent_get.json()
    assert any(m["sender_type"] == "internal_note" for m in agent_ticket["messages"])


