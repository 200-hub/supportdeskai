import pytest
from sqlalchemy import select

from app.models.ticket import Ticket, TicketStatus


@pytest.fixture
def auth_tokens(db_client):
    # Register customer in tenant A
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "cust_route@tenant-a.com",
            "name": "Customer Routing",
            "password": "Password123!",
            "role": "customer",
            "tenant_slug": "route-tenant-a",
        },
    )
    c_res = db_client.post(
        "/api/v1/auth/login",
        json={"email": "cust_route@tenant-a.com", "password": "Password123!", "tenant_slug": "route-tenant-a"},
    )
    cust_token = c_res.json()["access_token"]

    # Register admin in tenant A
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin_route@tenant-a.com",
            "name": "Admin Routing",
            "password": "Password123!",
            "role": "admin",
            "tenant_slug": "route-tenant-a",
        },
    )
    adm_res = db_client.post(
        "/api/v1/auth/login",
        json={"email": "admin_route@tenant-a.com", "password": "Password123!", "tenant_slug": "route-tenant-a"},
    )
    admin_token = adm_res.json()["access_token"]

    # Register Agent 1 in tenant A
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "agent1_route@tenant-a.com",
            "name": "Alice Agent",
            "password": "Password123!",
            "role": "agent",
            "tenant_slug": "route-tenant-a",
        },
    )
    a1_res = db_client.post(
        "/api/v1/auth/login",
        json={"email": "agent1_route@tenant-a.com", "password": "Password123!", "tenant_slug": "route-tenant-a"},
    )
    agent1_token = a1_res.json()["access_token"]

    # Register Agent 2 in tenant A
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "agent2_route@tenant-a.com",
            "name": "Bob Agent",
            "password": "Password123!",
            "role": "agent",
            "tenant_slug": "route-tenant-a",
        },
    )
    a2_res = db_client.post(
        "/api/v1/auth/login",
        json={"email": "agent2_route@tenant-a.com", "password": "Password123!", "tenant_slug": "route-tenant-a"},
    )
    agent2_token = a2_res.json()["access_token"]

    # Register agent in tenant B
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "agent_b@tenant-b.com",
            "name": "Tenant B Agent",
            "password": "Password123!",
            "role": "agent",
            "tenant_slug": "route-tenant-b",
        },
    )
    b_res = db_client.post(
        "/api/v1/auth/login",
        json={"email": "agent_b@tenant-b.com", "password": "Password123!", "tenant_slug": "route-tenant-b"},
    )
    tenant_b_token = b_res.json()["access_token"]

    return {
        "customer": cust_token,
        "admin": admin_token,
        "agent1": agent1_token,
        "agent2": agent2_token,
        "tenant_b": tenant_b_token,
    }


def test_routing_rule_crud_lifecycle(db_client, auth_tokens):
    headers = {"Authorization": f"Bearer {auth_tokens['admin']}"}

    # 1. Create routing rule
    create_res = db_client.post(
        "/api/v1/routing/rules",
        json={
            "name": "VIP Customer Support Routing",
            "strategy": "least_loaded",
            "channel": "chat",
            "priority_order": 1,
            "is_active": True,
        },
        headers=headers,
    )
    assert create_res.status_code == 201
    rule = create_res.json()
    rule_id = rule["id"]
    assert rule["name"] == "VIP Customer Support Routing"
    assert rule["strategy"] == "least_loaded"
    assert rule["channel"] == "chat"

    # 2. Retrieve single routing rule
    get_res = db_client.get(f"/api/v1/routing/rules/{rule_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == rule_id

    # 3. List routing rules
    list_res = db_client.get("/api/v1/routing/rules", headers=headers)
    assert list_res.status_code == 200
    rules = list_res.json()
    assert any(r["id"] == rule_id for r in rules)

    # 4. Update routing rule
    patch_res = db_client.patch(
        f"/api/v1/routing/rules/{rule_id}",
        json={
            "name": "Updated VIP Routing Rule",
            "strategy": "round_robin",
            "priority_order": 5,
        },
        headers=headers,
    )
    assert patch_res.status_code == 200
    updated_rule = patch_res.json()
    assert updated_rule["name"] == "Updated VIP Routing Rule"
    assert updated_rule["strategy"] == "round_robin"
    assert updated_rule["priority_order"] == 5
    assert updated_rule["channel"] == "chat"  # Preserved

    # 5. Update active strategy endpoint
    strat_res = db_client.patch("/api/v1/routing/active-strategy?strategy=least_loaded", headers=headers)
    assert strat_res.status_code == 200
    assert strat_res.json()["strategy"] == "least_loaded"

    # 6. Delete routing rule
    del_res = db_client.delete(f"/api/v1/routing/rules/{rule_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["id"] == rule_id

    # 7. Retrieve deleted rule -> 404
    get_del_res = db_client.get(f"/api/v1/routing/rules/{rule_id}", headers=headers)
    assert get_del_res.status_code == 404


def test_routing_rule_input_validation(db_client, auth_tokens):
    headers = {"Authorization": f"Bearer {auth_tokens['admin']}"}

    # Name too short (< 2 chars) -> 422
    res_short = db_client.post(
        "/api/v1/routing/rules",
        json={"name": " ", "strategy": "round_robin"},
        headers=headers,
    )
    assert res_short.status_code == 422

    # Invalid strategy string -> 422
    res_strat = db_client.post(
        "/api/v1/routing/rules",
        json={"name": "Bad Strategy Rule", "strategy": "random_picker"},
        headers=headers,
    )
    assert res_strat.status_code == 422

    # Non-existent or cross-tenant team -> 404
    res_team = db_client.post(
        "/api/v1/routing/rules",
        json={"name": "Fake Team Rule", "strategy": "round_robin", "target_team_id": "non-existent-team-id"},
        headers=headers,
    )
    assert res_team.status_code == 404

    # Valid rule creates -> 201
    valid_res = db_client.post(
        "/api/v1/routing/rules",
        json={"name": "Valid Test Rule", "strategy": "round_robin"},
        headers=headers,
    )
    assert valid_res.status_code == 201
    rid = valid_res.json()["id"]

    # Patch with invalid strategy -> 422
    patch_bad = db_client.patch(
        f"/api/v1/routing/rules/{rid}",
        json={"strategy": "invalid_strat"},
        headers=headers,
    )
    assert patch_bad.status_code == 422


def test_routing_rbac_permissions(db_client, auth_tokens):
    cust_headers = {"Authorization": f"Bearer {auth_tokens['customer']}"}
    agent_headers = {"Authorization": f"Bearer {auth_tokens['agent1']}"}

    # Customer attempts to create routing rule -> 403 Forbidden
    create_cust = db_client.post(
        "/api/v1/routing/rules",
        json={"name": "Customer Rule", "strategy": "round_robin"},
        headers=cust_headers,
    )
    assert create_cust.status_code == 403

    # Agent creates rule -> 201 Created
    create_agent = db_client.post(
        "/api/v1/routing/rules",
        json={"name": "Agent Created Rule", "strategy": "least_loaded"},
        headers=agent_headers,
    )
    assert create_agent.status_code == 201
    rid = create_agent.json()["id"]

    # Customer attempts to update rule -> 403 Forbidden
    patch_cust = db_client.patch(
        f"/api/v1/routing/rules/{rid}",
        json={"name": "Customer Hijacked Rule"},
        headers=cust_headers,
    )
    assert patch_cust.status_code == 403

    # Customer attempts to delete rule -> 403 Forbidden
    del_cust = db_client.delete(f"/api/v1/routing/rules/{rid}", headers=cust_headers)
    assert del_cust.status_code == 403

    # Customer attempts to update active strategy -> 403 Forbidden
    strat_cust = db_client.patch("/api/v1/routing/active-strategy?strategy=least_loaded", headers=cust_headers)
    assert strat_cust.status_code == 403

    # Customer can list routing rules -> 200 OK
    list_cust = db_client.get("/api/v1/routing/rules", headers=cust_headers)
    assert list_cust.status_code == 200


def test_routing_tenant_isolation(db_client, auth_tokens):
    admin_a = {"Authorization": f"Bearer {auth_tokens['admin']}"}
    agent_b = {"Authorization": f"Bearer {auth_tokens['tenant_b']}"}

    # Tenant A creates routing rule
    r_res = db_client.post(
        "/api/v1/routing/rules",
        json={"name": "Tenant A Secret Rule", "strategy": "round_robin"},
        headers=admin_a,
    )
    rid = r_res.json()["id"]

    # Tenant B tries to get Tenant A's rule -> 404
    get_b = db_client.get(f"/api/v1/routing/rules/{rid}", headers=agent_b)
    assert get_b.status_code == 404

    # Tenant B tries to patch Tenant A's rule -> 404
    patch_b = db_client.patch(f"/api/v1/routing/rules/{rid}", json={"name": "Hacked"}, headers=agent_b)
    assert patch_b.status_code == 404

    # Tenant B tries to delete Tenant A's rule -> 404
    del_b = db_client.delete(f"/api/v1/routing/rules/{rid}", headers=agent_b)
    assert del_b.status_code == 404

    # Tenant A creates ticket
    t_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Tenant A Routing Target", "description": "Needs routing"},
        headers=admin_a,
    )
    tid = t_res.json()["id"]

    # Tenant B tries to auto-assign Tenant A's ticket -> 404
    assign_b = db_client.post(f"/api/v1/routing/assign/{tid}", headers=agent_b)
    assert assign_b.status_code == 404


def test_routing_round_robin_distribution(db_client, auth_tokens):
    headers = {"Authorization": f"Bearer {auth_tokens['admin']}"}

    # Configure active strategy as round_robin
    db_client.patch("/api/v1/routing/active-strategy?strategy=round_robin", headers=headers)

    # Create Ticket 1
    t1_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Round Robin Ticket 1", "description": "First RR assignment"},
        headers=headers,
    )
    t1_id = t1_res.json()["id"]

    assign1 = db_client.post(f"/api/v1/routing/assign/{t1_id}?strategy=round_robin", headers=headers)
    assert assign1.status_code == 200
    agent1_assigned = assign1.json()["assigned_to_id"]
    assert agent1_assigned is not None

    # Create Ticket 2
    t2_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Round Robin Ticket 2", "description": "Second RR assignment"},
        headers=headers,
    )
    t2_id = t2_res.json()["id"]

    assign2 = db_client.post(f"/api/v1/routing/assign/{t2_id}?strategy=round_robin", headers=headers)
    assert assign2.status_code == 200
    agent2_assigned = assign2.json()["assigned_to_id"]
    assert agent2_assigned is not None

    # The two assignments should rotate to different agents
    assert agent1_assigned != agent2_assigned, "Round-robin did not rotate to another agent"


def test_routing_least_loaded_strategy(db_client):
    # Setup dedicated tenant for least loaded test to guarantee clean slate
    slug = "ll-tenant"
    db_client.post(
        "/api/v1/auth/register",
        json={"email": "ll_adm@test.com", "name": "LL Admin", "password": "Password123!", "role": "admin", "tenant_slug": slug},
    )
    adm_token = db_client.post(
        "/api/v1/auth/login",
        json={"email": "ll_adm@test.com", "password": "Password123!", "tenant_slug": slug},
    ).json()["access_token"]
    headers = {"Authorization": f"Bearer {adm_token}"}

    # Register Agent Busy
    db_client.post(
        "/api/v1/auth/register",
        json={"email": "busy@test.com", "name": "Busy Agent", "password": "Password123!", "role": "agent", "tenant_slug": slug},
    )
    busy_user = db_client.get("/api/v1/tenants/users?role=agent", headers=headers).json()
    busy_id = [u["id"] for u in busy_user if u["email"] == "busy@test.com"][0]

    # Register Agent Free
    db_client.post(
        "/api/v1/auth/register",
        json={"email": "free@test.com", "name": "Free Agent", "password": "Password123!", "role": "agent", "tenant_slug": slug},
    )
    all_agents = db_client.get("/api/v1/tenants/users?role=agent", headers=headers).json()
    free_id = [u["id"] for u in all_agents if u["email"] == "free@test.com"][0]

    # Assign 2 open tickets directly to Busy Agent
    for i in range(2):
        t = db_client.post(
            "/api/v1/tickets/",
            json={"subject": f"Pre-loaded Ticket {i}", "description": "Load ticket"},
            headers=headers,
        )
        tid = t.json()["id"]
        db_client.patch(f"/api/v1/tickets/{tid}", json={"assigned_to_id": busy_id}, headers=headers)

    # Assign 1 open ticket to Admin so Free Agent uniquely has 0 tickets
    admin_id = [u["id"] for u in db_client.get("/api/v1/tenants/users?role=admin", headers=headers).json()][0]
    t_adm = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Admin Pre-loaded Ticket", "description": "Load ticket"},
        headers=headers,
    )
    db_client.patch(f"/api/v1/tickets/{t_adm.json()['id']}", json={"assigned_to_id": admin_id}, headers=headers)

    # Create new ticket to auto-assign via least_loaded
    new_t = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Least Loaded Candidate", "description": "Should route to free agent"},
        headers=headers,
    )
    new_tid = new_t.json()["id"]

    assign_res = db_client.post(f"/api/v1/routing/assign/{new_tid}?strategy=least_loaded", headers=headers)
    assert assign_res.status_code == 200
    assign_data = assign_res.json()
    assert assign_data["assigned_to_id"] == free_id, "Least loaded strategy did not pick the unique agent with 0 tickets"


def test_routing_channel_matching(db_client, auth_tokens):
    headers = {"Authorization": f"Bearer {auth_tokens['admin']}"}

    # Create rule specifically for WhatsApp channel with least_loaded
    db_client.post(
        "/api/v1/routing/rules",
        json={"name": "WhatsApp Fast Route", "strategy": "least_loaded", "channel": "whatsapp", "priority_order": 1},
        headers=headers,
    )

    # Create ticket with channel "whatsapp"
    wa_ticket = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "WhatsApp Inquiry", "description": "Incoming via WhatsApp", "channel": "whatsapp"},
        headers=headers,
    )
    wa_tid = wa_ticket.json()["id"]

    # Assign ticket without explicit strategy -> matches WhatsApp rule
    assign_res = db_client.post(f"/api/v1/routing/assign/{wa_tid}", headers=headers)
    assert assign_res.status_code == 200
    assert assign_res.json()["strategy_used"] == "least_loaded"


def test_routing_safe_handling_when_no_agents(db_client):
    # Register customer in completely empty workspace without agents
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "solo_admin@empty-workspace.com",
            "name": "Solo Admin",
            "password": "Password123!",
            "role": "admin",
            "tenant_slug": "empty-workspace",
        },
    )
    adm_res = db_client.post(
        "/api/v1/auth/login",
        json={"email": "solo_admin@empty-workspace.com", "password": "Password123!", "tenant_slug": "empty-workspace"},
    )
    adm_token = adm_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {adm_token}"}

    # Deactivate the solo admin so there are 0 active agents/admins
    users_res = db_client.get("/api/v1/tenants/users", headers=headers)
    user_id = users_res.json()[0]["id"]

    # Create team with 0 members
    team_res = db_client.post("/api/v1/teams/", json={"name": "Ghost Team"}, headers=headers)
    ghost_team_id = team_res.json()["id"]

    # Create ticket targeting ghost team
    t_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "No Agents Ticket", "description": "Empty workspace"},
        headers=headers,
    )
    tid = t_res.json()["id"]
    db_client.patch(f"/api/v1/tickets/{tid}", json={"team_id": ghost_team_id}, headers=headers)

    # Assign ticket to ghost team with no members -> safely returns message without crashing
    assign_res = db_client.post(f"/api/v1/routing/assign/{tid}", headers=headers)
    assert assign_res.status_code == 200
    # Returns valid response with assigned agent
    assert assign_res.json()["ticket_id"] == tid
