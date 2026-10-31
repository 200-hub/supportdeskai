from datetime import datetime, timedelta, timezone
import pytest
from sqlalchemy import select

from app.models.ticket import Ticket, TicketMessage, MessageSenderType, TicketStatus, TicketPriority


@pytest.fixture
def auth_tokens(db_client):
    # Register customer in tenant A
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "cust_sla@tenant-a.com",
            "name": "Customer SLA",
            "password": "Password123!",
            "role": "customer",
            "tenant_slug": "tenant-a",
        },
    )
    c_res = db_client.post(
        "/api/v1/auth/login",
        json={"email": "cust_sla@tenant-a.com", "password": "Password123!", "tenant_slug": "tenant-a"},
    )
    cust_token = c_res.json()["access_token"]

    # Register second customer in tenant A (to test intra-tenant customer privacy)
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "cust_other@tenant-a.com",
            "name": "Customer Other",
            "password": "Password123!",
            "role": "customer",
            "tenant_slug": "tenant-a",
        },
    )
    c2_res = db_client.post(
        "/api/v1/auth/login",
        json={"email": "cust_other@tenant-a.com", "password": "Password123!", "tenant_slug": "tenant-a"},
    )
    cust2_token = c2_res.json()["access_token"]

    # Register agent in tenant A
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "agent_sla@tenant-a.com",
            "name": "Agent SLA",
            "password": "Password123!",
            "role": "agent",
            "tenant_slug": "tenant-a",
        },
    )
    a_res = db_client.post(
        "/api/v1/auth/login",
        json={"email": "agent_sla@tenant-a.com", "password": "Password123!", "tenant_slug": "tenant-a"},
    )
    agent_token = a_res.json()["access_token"]

    # Register admin in tenant A
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin_sla@tenant-a.com",
            "name": "Admin SLA",
            "password": "Password123!",
            "role": "admin",
            "tenant_slug": "tenant-a",
        },
    )
    adm_res = db_client.post(
        "/api/v1/auth/login",
        json={"email": "admin_sla@tenant-a.com", "password": "Password123!", "tenant_slug": "tenant-a"},
    )
    admin_token = adm_res.json()["access_token"]

    # Register agent in tenant B
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "agent_sla@tenant-b.com",
            "name": "Agent Tenant B",
            "password": "Password123!",
            "role": "agent",
            "tenant_slug": "tenant-b",
        },
    )
    b_res = db_client.post(
        "/api/v1/auth/login",
        json={"email": "agent_sla@tenant-b.com", "password": "Password123!", "tenant_slug": "tenant-b"},
    )
    tenant_b_token = b_res.json()["access_token"]

    return {
        "customer": cust_token,
        "customer2": cust2_token,
        "agent": agent_token,
        "admin": admin_token,
        "tenant_b": tenant_b_token,
    }


def test_sla_policy_crud_lifecycle_and_defaults(db_client, auth_tokens):
    headers = {"Authorization": f"Bearer {auth_tokens['agent']}"}

    # 1. Listing policies creates default policies if none exist
    list_res = db_client.get("/api/v1/sla/policies", headers=headers)
    assert list_res.status_code == 200
    policies = list_res.json()
    assert len(policies) >= 4
    priorities = {p["priority"] for p in policies}
    assert {"urgent", "high", "medium", "low"}.issubset(priorities)

    # 2. Create custom SLA policy
    create_res = db_client.post(
        "/api/v1/sla/policies",
        json={
            "name": "Mission Critical Enterprise Tier",
            "priority": "urgent",
            "first_response_time_minutes": 10,
            "resolution_time_minutes": 60,
            "business_hours_only": False,
        },
        headers=headers,
    )
    assert create_res.status_code == 201
    created_policy = create_res.json()
    policy_id = created_policy["id"]
    assert created_policy["name"] == "Mission Critical Enterprise Tier"
    assert created_policy["first_response_time_minutes"] == 10
    assert created_policy["resolution_time_minutes"] == 60

    # 3. Retrieve single SLA policy
    get_res = db_client.get(f"/api/v1/sla/policies/{policy_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == policy_id

    # 4. Update SLA policy
    patch_res = db_client.patch(
        f"/api/v1/sla/policies/{policy_id}",
        json={
            "name": "Updated Mission Critical Tier",
            "resolution_time_minutes": 90,
        },
        headers=headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Updated Mission Critical Tier"
    assert patch_res.json()["resolution_time_minutes"] == 90
    assert patch_res.json()["first_response_time_minutes"] == 10  # Preserved

    # 5. Delete SLA policy
    del_res = db_client.delete(f"/api/v1/sla/policies/{policy_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["id"] == policy_id

    # 6. Retrieve deleted policy returns 404
    get_del_res = db_client.get(f"/api/v1/sla/policies/{policy_id}", headers=headers)
    assert get_del_res.status_code == 404


def test_sla_policy_input_validation(db_client, auth_tokens):
    headers = {"Authorization": f"Bearer {auth_tokens['admin']}"}

    # Name too short (< 2 chars) -> 422
    res_short = db_client.post(
        "/api/v1/sla/policies",
        json={"name": " ", "priority": "high", "first_response_time_minutes": 30, "resolution_time_minutes": 120},
        headers=headers,
    )
    assert res_short.status_code == 422

    # Invalid priority string -> 422
    res_pri = db_client.post(
        "/api/v1/sla/policies",
        json={"name": "Invalid Pri Policy", "priority": "super-urgent", "first_response_time_minutes": 30, "resolution_time_minutes": 120},
        headers=headers,
    )
    assert res_pri.status_code == 422

    # Resolution time < first response time -> 422
    res_times = db_client.post(
        "/api/v1/sla/policies",
        json={"name": "Impossible Target Policy", "priority": "urgent", "first_response_time_minutes": 120, "resolution_time_minutes": 60},
        headers=headers,
    )
    assert res_times.status_code == 422

    # Valid policy creates successfully
    res_ok = db_client.post(
        "/api/v1/sla/policies",
        json={"name": "VIP Fast Track", "priority": "high", "first_response_time_minutes": 30, "resolution_time_minutes": 120},
        headers=headers,
    )
    assert res_ok.status_code == 201
    pid = res_ok.json()["id"]

    # Patch with invalid resolution time (< first response) -> 422
    res_patch_invalid = db_client.patch(
        f"/api/v1/sla/policies/{pid}",
        json={"resolution_time_minutes": 15},  # First response was 30
        headers=headers,
    )
    assert res_patch_invalid.status_code == 422


def test_sla_rbac_permissions(db_client, auth_tokens):
    cust_headers = {"Authorization": f"Bearer {auth_tokens['customer']}"}
    agent_headers = {"Authorization": f"Bearer {auth_tokens['agent']}"}

    # Customer attempts to create policy -> 403 Forbidden
    create_cust = db_client.post(
        "/api/v1/sla/policies",
        json={"name": "Customer SLA", "priority": "urgent", "first_response_time_minutes": 5, "resolution_time_minutes": 30},
        headers=cust_headers,
    )
    assert create_cust.status_code == 403

    # Agent creates policy -> 201 Created
    create_agent = db_client.post(
        "/api/v1/sla/policies",
        json={"name": "Agent Created SLA", "priority": "urgent", "first_response_time_minutes": 5, "resolution_time_minutes": 30},
        headers=agent_headers,
    )
    assert create_agent.status_code == 201
    pid = create_agent.json()["id"]

    # Customer attempts to update policy -> 403 Forbidden
    patch_cust = db_client.patch(
        f"/api/v1/sla/policies/{pid}",
        json={"name": "Customer Hijacked SLA"},
        headers=cust_headers,
    )
    assert patch_cust.status_code == 403

    # Customer attempts to delete policy -> 403 Forbidden
    del_cust = db_client.delete(f"/api/v1/sla/policies/{pid}", headers=cust_headers)
    assert del_cust.status_code == 403

    # Customer can view policies list -> 200 OK
    list_cust = db_client.get("/api/v1/sla/policies", headers=cust_headers)
    assert list_cust.status_code == 200


def test_sla_tenant_isolation(db_client, auth_tokens):
    agent_a = {"Authorization": f"Bearer {auth_tokens['agent']}"}
    agent_b = {"Authorization": f"Bearer {auth_tokens['tenant_b']}"}

    # Tenant A creates policy
    p_res = db_client.post(
        "/api/v1/sla/policies",
        json={"name": "Tenant A Secret Policy", "priority": "high", "first_response_time_minutes": 20, "resolution_time_minutes": 100},
        headers=agent_a,
    )
    pid = p_res.json()["id"]

    # Tenant B tries to get Tenant A's policy -> 404
    get_b = db_client.get(f"/api/v1/sla/policies/{pid}", headers=agent_b)
    assert get_b.status_code == 404

    # Tenant B tries to patch Tenant A's policy -> 404
    patch_b = db_client.patch(f"/api/v1/sla/policies/{pid}", json={"name": "Hacked"}, headers=agent_b)
    assert patch_b.status_code == 404

    # Tenant B tries to delete Tenant A's policy -> 404
    del_b = db_client.delete(f"/api/v1/sla/policies/{pid}", headers=agent_b)
    assert del_b.status_code == 404


def test_sla_evaluation_customer_ownership(db_client, auth_tokens):
    cust_a = {"Authorization": f"Bearer {auth_tokens['customer']}"}
    cust_a2 = {"Authorization": f"Bearer {auth_tokens['customer2']}"}
    agent_a = {"Authorization": f"Bearer {auth_tokens['agent']}"}
    agent_b = {"Authorization": f"Bearer {auth_tokens['tenant_b']}"}

    # Customer A creates ticket
    t_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "SLA Evaluation Ticket", "description": "Need evaluation", "priority": "urgent"},
        headers=cust_a,
    )
    tid = t_res.json()["id"]

    # Customer A2 in same tenant tries to evaluate Customer A's ticket -> 403 Forbidden
    eval_c2 = db_client.post(f"/api/v1/sla/evaluate/{tid}", headers=cust_a2)
    assert eval_c2.status_code == 403

    # Cross-tenant agent B tries to evaluate Ticket -> 404 Not Found
    eval_b = db_client.post(f"/api/v1/sla/evaluate/{tid}", headers=agent_b)
    assert eval_b.status_code == 404

    # Customer A evaluates own ticket -> 200 OK
    eval_own = db_client.post(f"/api/v1/sla/evaluate/{tid}", headers=cust_a)
    assert eval_own.status_code == 200
    res_data = eval_own.json()
    assert res_data["ticket_id"] == tid
    assert res_data["sla_status"] == "safe"
    assert res_data["response_deadline"] is not None
    assert res_data["resolution_deadline"] is not None

    # Agent evaluates ticket -> 200 OK
    eval_agent = db_client.post(f"/api/v1/sla/evaluate/{tid}", headers=agent_a)
    assert eval_agent.status_code == 200


def test_sla_pause_resume_behavior(db_client, auth_tokens):
    cust = {"Authorization": f"Bearer {auth_tokens['customer']}"}
    agent = {"Authorization": f"Bearer {auth_tokens['agent']}"}

    # Customer creates ticket
    t_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "SLA Pause Testing", "description": "Verify pause status", "priority": "medium"},
        headers=cust,
    )
    tid = t_res.json()["id"]

    # Agent sets status to pending (customer reply awaited)
    patch_pend = db_client.patch(
        f"/api/v1/tickets/{tid}",
        json={"status": "pending"},
        headers=agent,
    )
    assert patch_pend.status_code == 200
    assert patch_pend.json()["sla_paused"] is True
    assert "Paused" in patch_pend.json()["sla_remaining"]

    # Evaluate SLA for paused ticket
    eval_paused = db_client.post(f"/api/v1/sla/evaluate/{tid}", headers=agent)
    assert eval_paused.status_code == 200
    assert eval_paused.json()["is_paused"] is True
    assert eval_paused.json()["sla_status"] == "safe"
    assert "Paused" in eval_paused.json()["sla_remaining"]

    # Agent resumes ticket (status back to open)
    patch_open = db_client.patch(
        f"/api/v1/tickets/{tid}",
        json={"status": "open"},
        headers=agent,
    )
    assert patch_open.status_code == 200
    assert patch_open.json()["sla_paused"] is False

    # Evaluate SLA for resumed ticket
    eval_resumed = db_client.post(f"/api/v1/sla/evaluate/{tid}", headers=agent)
    assert eval_resumed.status_code == 200
    assert eval_resumed.json()["is_paused"] is False


def test_sla_resolved_ticket_finalization(db_client, auth_tokens):
    cust = {"Authorization": f"Bearer {auth_tokens['customer']}"}
    agent = {"Authorization": f"Bearer {auth_tokens['agent']}"}

    # Create ticket
    t_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Resolution SLA Check", "description": "Verify resolution status", "priority": "high"},
        headers=cust,
    )
    tid = t_res.json()["id"]

    # Agent resolves ticket
    patch_res = db_client.patch(
        f"/api/v1/tickets/{tid}",
        json={"status": "resolved"},
        headers=agent,
    )
    assert patch_res.status_code == 200
    assert "Resolved" in patch_res.json()["sla_remaining"]

    # Evaluate SLA
    eval_res = db_client.post(f"/api/v1/sla/evaluate/{tid}", headers=agent)
    assert eval_res.status_code == 200
    assert eval_res.json()["sla_status"] == "safe"
    assert "Resolved" in eval_res.json()["sla_remaining"]


def test_ticket_creation_and_reprioritization_applies_sla(db_client, auth_tokens):
    cust = {"Authorization": f"Bearer {auth_tokens['customer']}"}
    agent = {"Authorization": f"Bearer {auth_tokens['agent']}"}

    # 1. Create ticket with urgent priority -> remaining initialized to urgent resolution time
    t_urgent = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Urgent Outage", "description": "Database is unreachable", "priority": "urgent"},
        headers=cust,
    )
    assert t_urgent.status_code == 201
    assert t_urgent.json()["sla_remaining"] in ["120m", "2h"]

    # 2. Create ticket with low priority -> remaining initialized to low resolution time
    t_low = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Minor Typo", "description": "Spelling error in footer", "priority": "low"},
        headers=cust,
    )
    assert t_low.status_code == 201
    assert t_low.json()["sla_remaining"] in ["2880m", "48h"]

    # 3. Agent re-prioritizes ticket from low to high -> SLA target updates to high tier
    tid_low = t_low.json()["id"]
    patch_pri = db_client.patch(
        f"/api/v1/tickets/{tid_low}",
        json={"priority": "high"},
        headers=agent,
    )
    assert patch_pri.status_code == 200
    assert patch_pri.json()["priority"] == "high"
    assert patch_pri.json()["sla_remaining"] in ["360m", "6h"]

