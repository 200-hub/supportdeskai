"""
Cross-Module End-to-End Integration Test Suite for SupportDeskAI
===============================================================
Covers the complete, unified lifecycle across all 10 core modules:
1. Authentication & Multi-Tenancy (Workspaces, role registration, JWT login, token rotation)
2. Users & Teams (Admin creates team and assigns agent members)
3. Contacts & Organizations (CRM account and contact creation with domain association)
4. Channels & Secret Masking (Email channel with sensitive SMTP credentials masked)
5. SLA Management (Auto-initialization of default policies, custom urgent SLA policy creation)
6. Routing Engine (Channel-based routing rule configured to dispatch to assigned teams)
7. Automations Engine (Event-driven rule execution on ticket_created for automatic triage)
8. Ticket Management (Multi-tenant ticket lifecycle, automatic SLA calculation, automatic triage)
9. Macros Engine (Agent applies canned action bundle: customer reply interpolation, internal note, status update, tag addition, SLA pause)
10. Strict Security & Boundary Checks:
    - Customer role access controls (403 on admin/agent endpoints, internal note invisibility)
    - Full cross-tenant isolation (Tenant B cannot read or mutate any Tenant A resources)
"""
import json
import pytest


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_full_ten_module_end_to_end_lifecycle(db_client):
    """
    Executes a cohesive end-to-end integration workflow across all 10 core modules:
    Auth -> Tenants -> Users/Teams -> CRM -> Channels -> SLA -> Routing -> Automations -> Tickets -> Macros
    """

    # -------------------------------------------------------------------------
    # 1. Module 1 & 2: Auth, Workspaces & Token Rotation
    # -------------------------------------------------------------------------
    slug_a = "alpha-lifecycle-corp"

    # Register Admin A
    reg_admin = db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@alpha-corp.io",
            "name": "Alpha Admin",
            "password": "Password123!",
            "role": "admin",
            "tenant_slug": slug_a,
        },
    )
    assert reg_admin.status_code == 201

    login_admin = db_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@alpha-corp.io", "password": "Password123!", "tenant_slug": slug_a},
    )
    assert login_admin.status_code == 200
    admin_tokens = login_admin.json()
    admin_token = admin_tokens["access_token"]
    refresh_token = admin_tokens["refresh_token"]
    admin_id = admin_tokens["user"]["id"]
    hdrs_admin = _auth(admin_token)

    # Test Refresh Token Rotation
    refresh_res = db_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_res.status_code == 200
    rotated_data = refresh_res.json()
    new_admin_token = rotated_data["access_token"]
    hdrs_admin = _auth(new_admin_token)

    # Verify /me with refreshed access token
    me_res = db_client.get("/api/v1/auth/me", headers=hdrs_admin)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "admin@alpha-corp.io"
    assert me_res.json()["role"] == "admin"

    # Register Agent A
    reg_agent = db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "agent@alpha-corp.io",
            "name": "Alpha Agent",
            "password": "Password123!",
            "role": "agent",
            "tenant_slug": slug_a,
        },
    )
    assert reg_agent.status_code == 201
    login_agent = db_client.post(
        "/api/v1/auth/login",
        json={"email": "agent@alpha-corp.io", "password": "Password123!", "tenant_slug": slug_a},
    )
    agent_token = login_agent.json()["access_token"]
    agent_id = login_agent.json()["user"]["id"]
    hdrs_agent = _auth(agent_token)

    # Register Customer A
    reg_cust = db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "customer@alpha-corp.io",
            "name": "Tony Customer",
            "password": "Password123!",
            "role": "customer",
            "tenant_slug": slug_a,
        },
    )
    assert reg_cust.status_code == 201
    login_cust = db_client.post(
        "/api/v1/auth/login",
        json={"email": "customer@alpha-corp.io", "password": "Password123!", "tenant_slug": slug_a},
    )
    cust_token = login_cust.json()["access_token"]
    cust_id = login_cust.json()["user"]["id"]
    hdrs_cust = _auth(cust_token)

    # -------------------------------------------------------------------------
    # 2. Module 3: Users & Teams
    # -------------------------------------------------------------------------
    # Admin creates Tier 2 Escalation Team
    team_res = db_client.post(
        "/api/v1/teams/",
        json={"name": "Tier 2 Mission Critical", "description": "High priority incident resolution squad"},
        headers=hdrs_admin,
    )
    assert team_res.status_code == 201
    team_data = team_res.json()
    team_id = team_data["id"]
    assert team_data["name"] == "Tier 2 Mission Critical"

    # Admin assigns Agent to the team
    assign_member_res = db_client.post(
        f"/api/v1/teams/{team_id}/members/{agent_id}",
        headers=hdrs_admin,
    )
    assert assign_member_res.status_code == 200

    # Verify team membership
    get_team_res = db_client.get(f"/api/v1/teams/{team_id}", headers=hdrs_admin)
    assert get_team_res.status_code == 200
    assert any(m["id"] == agent_id for m in get_team_res.json().get("members", []))

    # -------------------------------------------------------------------------
    # 3. Module 4: CRM Organizations & Contacts
    # -------------------------------------------------------------------------
    # Admin creates Organization
    org_res = db_client.post(
        "/api/v1/crm/organizations",
        json={"name": "Stark Global Industries", "domain": "stark.com", "description": "Global defense client"},
        headers=hdrs_admin,
    )
    assert org_res.status_code == 201
    org_id = org_res.json()["id"]

    # Admin creates Contact linked to Organization
    contact_res = db_client.post(
        "/api/v1/crm/contacts",
        json={
            "name": "Tony Customer",
            "email": "customer@alpha-corp.io",
            "phone": "+1 415-555-0199",
            "organization_id": org_id,
            "notes": "Key technical decision maker",
        },
        headers=hdrs_admin,
    )
    assert contact_res.status_code == 201
    contact_id = contact_res.json()["id"]

    # -------------------------------------------------------------------------
    # 4. Module 5: Channels & Secret Masking
    # -------------------------------------------------------------------------
    channel_res = db_client.post(
        "/api/v1/channels/",
        json={
            "name": "Enterprise Inbound Helpdesk",
            "type": "email",
            "is_active": True,
            "config_json": json.dumps({
                "host": "imap.alpha-corp.io",
                "port": 993,
                "smtp_password": "super_secret_smtp_password_9988",
                "api_key": "live_key_alpha_xyz_secret_4455",
            }),
        },
        headers=hdrs_admin,
    )
    assert channel_res.status_code == 201
    channel_data = channel_res.json()
    channel_id = channel_data["id"]
    # Verify sensitive secrets are masked
    assert "super_secret_smtp_password" not in channel_data["config_json"]
    assert "live_key_alpha_xyz_secret" not in channel_data["config_json"]
    assert "********" in channel_data["config_json"] or "***" in channel_data["config_json"]

    # -------------------------------------------------------------------------
    # 5. Module 7: SLA Policies
    # -------------------------------------------------------------------------
    # List policies: triggers default SLA initialization
    sla_list_res = db_client.get("/api/v1/sla/policies", headers=hdrs_admin)
    assert sla_list_res.status_code == 200
    assert len(sla_list_res.json()) >= 4

    # Create custom SLA policy for urgent incidents
    sla_create_res = db_client.post(
        "/api/v1/sla/policies",
        json={
            "name": "Mission Critical Alpha SLA",
            "priority": "urgent",
            "first_response_time_minutes": 15,
            "resolution_time_minutes": 120,
            "business_hours_only": False,
        },
        headers=hdrs_admin,
    )
    assert sla_create_res.status_code == 201
    sla_id = sla_create_res.json()["id"]

    # -------------------------------------------------------------------------
    # 6. Module 8: Routing Rules
    # -------------------------------------------------------------------------
    routing_res = db_client.post(
        "/api/v1/routing/rules",
        json={
            "name": "Urgent Email Dispatcher",
            "channel": "email",
            "target_team_id": team_id,
            "strategy": "least_loaded",
            "priority_order": 1,
            "is_active": True,
        },
        headers=hdrs_admin,
    )
    assert routing_res.status_code == 201
    routing_rule_id = routing_res.json()["id"]

    # -------------------------------------------------------------------------
    # 7. Module 10: Automation Rules
    # -------------------------------------------------------------------------
    auto_res = db_client.post(
        "/api/v1/automations/",
        json={
            "name": "Urgent Triage & Tagging",
            "trigger_event": "ticket_created",
            "conditions": [
                {"field": "priority", "op": "==", "value": "urgent"},
            ],
            "actions": [
                {"action": "add_tag", "value": "vip-triaged"},
                {"action": "add_internal_note", "value": "Automated triage executed: Urgent SLA activated."},
            ],
            "is_active": True,
            "execution_order": 1,
        },
        headers=hdrs_admin,
    )
    assert auto_res.status_code == 201
    auto_rule_id = auto_res.json()["id"]

    # -------------------------------------------------------------------------
    # 8. Module 9: Macros
    # -------------------------------------------------------------------------
    macro_res = db_client.post(
        "/api/v1/macros/",
        json={
            "title": "Acknowledge & Pause for Customer Details",
            "description": "Requests specs from customer and pauses SLA timer",
            "actions": {
                "response_text": "Hello {{customer.name}}, we are investigating '{{ticket.subject}}'. Could you confirm your cluster kernel version?",
                "internal_note": "Awaiting customer kernel specs. SLA timer is paused.",
                "status": "pending",
                "tags": ["awaiting-customer"],
            },
            "is_active": True,
        },
        headers=hdrs_admin,
    )
    assert macro_res.status_code == 201
    macro_id = macro_res.json()["id"]

    # -------------------------------------------------------------------------
    # 9. Module 6: Ticket Lifecycle & Automatic Integration
    # -------------------------------------------------------------------------
    # Customer creates an urgent ticket via email channel
    create_ticket_res = db_client.post(
        "/api/v1/tickets/",
        json={
            "subject": "Production Database Latency Spike",
            "description": "P99 latency increased by 400ms following deployment.",
            "category": "Infrastructure",
            "channel": "email",
            "priority": "urgent",
        },
        headers=hdrs_cust,
    )
    assert create_ticket_res.status_code == 201
    ticket = create_ticket_res.json()
    ticket_id = ticket["id"]

    # Assert SLA status and remaining are populated
    assert ticket["priority"] == "urgent"
    assert ticket["status"] == "open"
    assert ticket["sla_status"] is not None
    assert ticket["sla_remaining"] is not None

    # Verify SLA policy evaluation matches the custom urgent policy
    sla_eval_res = db_client.post(f"/api/v1/sla/evaluate/{ticket_id}", headers=hdrs_admin)
    assert sla_eval_res.status_code == 200
    sla_eval = sla_eval_res.json()
    assert sla_eval["first_response_due_minutes"] == 15
    assert sla_eval["resolution_due_minutes"] == 120

    # Assert Automation rule ran automatically upon creation:
    # 1. 'vip-triaged' tag added to tags_json
    tags = json.loads(ticket.get("tags_json") or "[]")
    assert "vip-triaged" in tags

    # 2. Automation internal note added
    notes_res = db_client.get(f"/api/v1/tickets/{ticket_id}/messages", headers=hdrs_agent)
    assert notes_res.status_code == 200
    agent_view_msgs = notes_res.json()
    assert any("Automated triage executed" in m["content"] and m["sender_type"] == "internal_note" for m in agent_view_msgs)

    # -------------------------------------------------------------------------
    # 10. Execute Routing Assignment
    # -------------------------------------------------------------------------
    route_assign_res = db_client.post(f"/api/v1/routing/assign/{ticket_id}", headers=hdrs_admin)
    assert route_assign_res.status_code == 200
    routed_ticket = route_assign_res.json()
    # Team member agent or team was assigned
    assert routed_ticket["assigned_to_id"] is not None or routed_ticket.get("team_id") is not None

    # -------------------------------------------------------------------------
    # 11. Agent Applies Macro to Ticket
    # -------------------------------------------------------------------------
    apply_macro_res = db_client.post(
        f"/api/v1/macros/{macro_id}/apply/{ticket_id}",
        headers=hdrs_agent,
    )
    assert apply_macro_res.status_code == 200
    macro_result = apply_macro_res.json()
    assert macro_result["success"] is True

    # Check updated ticket state
    get_ticket_res = db_client.get(f"/api/v1/tickets/{ticket_id}", headers=hdrs_agent)
    assert get_ticket_res.status_code == 200
    updated_ticket = get_ticket_res.json()

    # Verify status changed to 'pending'
    assert updated_ticket["status"] == "pending"
    # Verify SLA timer was paused
    assert updated_ticket["sla_paused"] is True
    # Verify tags were updated
    updated_tags = json.loads(updated_ticket.get("tags_json") or "[]")
    assert "vip-triaged" in updated_tags
    assert "awaiting-customer" in updated_tags

    # Verify messages: customer reply and internal note were posted
    agent_msgs_res = db_client.get(f"/api/v1/tickets/{ticket_id}/messages", headers=hdrs_agent)
    assert agent_msgs_res.status_code == 200
    all_msgs = agent_msgs_res.json()
    
    # Verify template interpolation in customer reply
    customer_replies = [m for m in all_msgs if m["sender_type"] == "agent"]
    assert len(customer_replies) >= 1
    reply_content = customer_replies[-1]["content"]
    assert "Production Database Latency Spike" in reply_content
    assert "confirm your cluster kernel version" in reply_content

    # Verify internal note was posted
    internal_notes = [m for m in all_msgs if m["sender_type"] == "internal_note"]
    assert any("Awaiting customer kernel specs" in n["content"] for n in internal_notes)

    # Verify audit timeline recorded macro application
    timeline_res = db_client.get(f"/api/v1/tickets/{ticket_id}/timeline", headers=hdrs_agent)
    assert timeline_res.status_code == 200
    timeline = timeline_res.json()
    assert any("Acknowledge & Pause for Customer Details" in event["title"] or "Macro" in event["title"] for event in timeline)


def test_cross_module_security_and_tenant_isolation_boundaries(db_client):
    """
    Validates boundary controls across all modules:
    - Customer role restrictions (403 Forbidden on privileged APIs)
    - Internal note masking (Customer cannot see internal notes)
    - Strict Multi-Tenant isolation (Tenant B cannot read or modify Tenant A resources)
    """
    # -------------------------------------------------------------------------
    # Setup Tenant A and Tenant B
    # -------------------------------------------------------------------------
    slug_a = "boundary-corp-a"
    slug_b = "boundary-corp-b"

    # Tenant A: Admin, Agent, Customer
    db_client.post("/api/v1/auth/register", json={"email": "adm@a.io", "name": "Admin A", "password": "Password123!", "role": "admin", "tenant_slug": slug_a})
    adm_a_tok = db_client.post("/api/v1/auth/login", json={"email": "adm@a.io", "password": "Password123!", "tenant_slug": slug_a}).json()["access_token"]
    hdrs_adm_a = _auth(adm_a_tok)

    db_client.post("/api/v1/auth/register", json={"email": "agt@a.io", "name": "Agent A", "password": "Password123!", "role": "agent", "tenant_slug": slug_a})
    agt_a_tok = db_client.post("/api/v1/auth/login", json={"email": "agt@a.io", "password": "Password123!", "tenant_slug": slug_a}).json()["access_token"]
    hdrs_agt_a = _auth(agt_a_tok)

    db_client.post("/api/v1/auth/register", json={"email": "cust@a.io", "name": "Customer A", "password": "Password123!", "role": "customer", "tenant_slug": slug_a})
    cust_a_tok = db_client.post("/api/v1/auth/login", json={"email": "cust@a.io", "password": "Password123!", "tenant_slug": slug_a}).json()["access_token"]
    hdrs_cust_a = _auth(cust_a_tok)

    # Tenant B: Admin
    db_client.post("/api/v1/auth/register", json={"email": "adm@b.io", "name": "Admin B", "password": "Password123!", "role": "admin", "tenant_slug": slug_b})
    adm_b_tok = db_client.post("/api/v1/auth/login", json={"email": "adm@b.io", "password": "Password123!", "tenant_slug": slug_b}).json()["access_token"]
    hdrs_adm_b = _auth(adm_b_tok)

    # -------------------------------------------------------------------------
    # Boundary 1: Customer Role Access Controls (RBAC)
    # -------------------------------------------------------------------------
    # 1. Routing Rule Creation -> 403 Forbidden
    assert db_client.post("/api/v1/routing/rules", json={"name": "Customer Hijack", "strategy": "round_robin"}, headers=hdrs_cust_a).status_code == 403

    # 2. SLA Policy Creation -> 403 Forbidden
    assert db_client.post("/api/v1/sla/policies", json={"name": "Cust SLA", "priority": "urgent", "first_response_time_minutes": 5, "resolution_time_minutes": 20}, headers=hdrs_cust_a).status_code == 403

    # 3. Automation Rule Creation -> 403 Forbidden
    assert db_client.post("/api/v1/automations/", json={"name": "Cust Auto", "trigger_event": "ticket_created", "conditions": [], "actions": [{"action": "add_tag", "value": "hacked"}]}, headers=hdrs_cust_a).status_code == 403

    # 4. Macro Creation -> 403 Forbidden
    assert db_client.post("/api/v1/macros/", json={"title": "Cust Macro", "actions": {"response_text": "Hi"}}, headers=hdrs_cust_a).status_code == 403

    # 5. Channel Creation -> 403 Forbidden
    assert db_client.post("/api/v1/channels/", json={"name": "Cust Chan", "type": "email", "config_json": "{}"}, headers=hdrs_cust_a).status_code == 403

    # 6. Team Creation -> 403 Forbidden
    assert db_client.post("/api/v1/teams/", json={"name": "Cust Team"}, headers=hdrs_cust_a).status_code == 403

    # -------------------------------------------------------------------------
    # Boundary 2: Internal Note Masking for Customers
    # -------------------------------------------------------------------------
    # Create ticket in Tenant A
    t_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Confidential Security Audit", "description": "Audit ticket for testing internal notes.", "priority": "high"},
        headers=hdrs_cust_a,
    )
    assert t_res.status_code == 201
    ticket_a_id = t_res.json()["id"]

    # Customer tries to post an internal note directly -> 403 Forbidden
    post_note_cust = db_client.post(
        f"/api/v1/tickets/{ticket_a_id}/messages",
        json={"content": "Customer attempt to forge internal note.", "sender_type": "internal_note"},
        headers=hdrs_cust_a,
    )
    assert post_note_cust.status_code == 403

    # Agent posts internal note
    agent_note = db_client.post(
        f"/api/v1/tickets/{ticket_a_id}/messages",
        json={"content": "Top Secret: Vulnerability assessment in progress.", "sender_type": "internal_note"},
        headers=hdrs_agt_a,
    )
    assert agent_note.status_code == 201

    # Customer views messages: Top Secret internal note MUST be filtered out
    cust_view_msgs = db_client.get(f"/api/v1/tickets/{ticket_a_id}/messages", headers=hdrs_cust_a)
    assert cust_view_msgs.status_code == 200
    assert not any(m["sender_type"] == "internal_note" for m in cust_view_msgs.json())
    assert not any("Top Secret" in m["content"] for m in cust_view_msgs.json())

    # Agent views messages: Internal note IS visible
    agent_view_msgs = db_client.get(f"/api/v1/tickets/{ticket_a_id}/messages", headers=hdrs_agt_a)
    assert agent_view_msgs.status_code == 200
    assert any("Top Secret" in m["content"] and m["sender_type"] == "internal_note" for m in agent_view_msgs.json())

    # -------------------------------------------------------------------------
    # Boundary 3: Cross-Tenant Isolation
    # -------------------------------------------------------------------------
    # Admin A creates resources in Tenant A
    team_a = db_client.post("/api/v1/teams/", json={"name": "A-Team"}, headers=hdrs_adm_a).json()["id"]
    org_a = db_client.post("/api/v1/crm/organizations", json={"name": "A-Org", "domain": "a.org"}, headers=hdrs_adm_a).json()["id"]
    contact_a = db_client.post("/api/v1/crm/contacts", json={"name": "A-Contact", "email": "contact@a.org"}, headers=hdrs_adm_a).json()["id"]
    chan_a = db_client.post("/api/v1/channels/", json={"name": "A-Channel", "type": "email", "config_json": "{}"}, headers=hdrs_adm_a).json()["id"]
    sla_a = db_client.post("/api/v1/sla/policies", json={"name": "A-SLA", "priority": "high", "first_response_time_minutes": 30, "resolution_time_minutes": 180}, headers=hdrs_adm_a).json()["id"]
    route_a = db_client.post("/api/v1/routing/rules", json={"name": "A-Routing", "strategy": "round_robin"}, headers=hdrs_adm_a).json()["id"]
    auto_a = db_client.post("/api/v1/automations/", json={"name": "A-Auto", "trigger_event": "ticket_created", "conditions": [], "actions": [{"action": "add_tag", "value": "a-tag"}]}, headers=hdrs_adm_a).json()["id"]
    macro_a = db_client.post("/api/v1/macros/", json={"title": "A-Macro", "actions": {"response_text": "A reply"}}, headers=hdrs_adm_a).json()["id"]

    # Tenant B Admin attempts to access Tenant A resources -> MUST all return 404
    assert db_client.get(f"/api/v1/tickets/{ticket_a_id}", headers=hdrs_adm_b).status_code == 404
    assert db_client.patch(f"/api/v1/tickets/{ticket_a_id}", json={"subject": "Hacked"}, headers=hdrs_adm_b).status_code == 404
    assert db_client.delete(f"/api/v1/tickets/{ticket_a_id}", headers=hdrs_adm_b).status_code == 404
    assert db_client.get(f"/api/v1/tickets/{ticket_a_id}/messages", headers=hdrs_adm_b).status_code == 404

    assert db_client.get(f"/api/v1/teams/{team_a}", headers=hdrs_adm_b).status_code == 404
    assert db_client.get(f"/api/v1/crm/organizations/{org_a}", headers=hdrs_adm_b).status_code == 404
    assert db_client.get(f"/api/v1/crm/contacts/{contact_a}", headers=hdrs_adm_b).status_code == 404
    assert db_client.get(f"/api/v1/channels/{chan_a}", headers=hdrs_adm_b).status_code == 404
    assert db_client.get(f"/api/v1/sla/policies/{sla_a}", headers=hdrs_adm_b).status_code == 404
    assert db_client.get(f"/api/v1/routing/rules/{route_a}", headers=hdrs_adm_b).status_code == 404
    assert db_client.get(f"/api/v1/automations/{auto_a}", headers=hdrs_adm_b).status_code == 404
    assert db_client.get(f"/api/v1/macros/{macro_a}", headers=hdrs_adm_b).status_code == 404

    # Tenant B attempts cross-tenant execution
    # Create ticket in Tenant B
    t_res_b = db_client.post("/api/v1/tickets/", json={"subject": "B Ticket", "description": "B Desc"}, headers=hdrs_adm_b)
    assert t_res_b.status_code == 201
    ticket_b_id = t_res_b.json()["id"]

    # Applying Tenant A's macro to Tenant B's ticket must fail with 404
    assert db_client.post(f"/api/v1/macros/{macro_a}/apply/{ticket_b_id}", headers=hdrs_adm_b).status_code == 404

    # Executing automations on Tenant A's ticket from Tenant B returns empty list (no leakage or mutation)
    exec_b_res = db_client.post(f"/api/v1/automations/execute/{ticket_a_id}", headers=hdrs_adm_b)
    assert exec_b_res.status_code == 200
    assert exec_b_res.json() == []

