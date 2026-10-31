import json
import pytest


@pytest.fixture
def auth_headers(db_client):
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "lead.agent@support.com",
            "name": "Lead Agent",
            "password": "Password123!",
            "role": "agent",
            "tenant_slug": "crm-test-tenant",
        },
    )
    login_resp = db_client.post(
        "/api/v1/auth/login",
        json={"email": "lead.agent@support.com", "password": "Password123!", "tenant_slug": "crm-test-tenant"},
    )
    token = login_resp.json()["access_token"]
    user_id = login_resp.json()["user"]["id"]
    return {"Authorization": f"Bearer {token}", "user_id": user_id}


def test_teams_crud(db_client, auth_headers):
    headers = {"Authorization": auth_headers["Authorization"]}

    # Create team
    res = db_client.post(
        "/api/v1/teams/",
        json={"name": "Tier 2 Infrastructure", "description": "Backend & Cloud troubleshooting"},
        headers=headers,
    )
    assert res.status_code == 201
    team = res.json()
    team_id = team["id"]
    assert team["name"] == "Tier 2 Infrastructure"

    # List teams
    list_res = db_client.get("/api/v1/teams/", headers=headers)
    assert list_res.status_code == 200
    assert any(t["id"] == team_id for t in list_res.json())

    # Assign member
    assign_res = db_client.post(
        f"/api/v1/teams/{team_id}/members/{auth_headers['user_id']}",
        headers=headers,
    )
    assert assign_res.status_code == 200


def test_crm_organizations_and_contacts(db_client, auth_headers):
    headers = {"Authorization": auth_headers["Authorization"]}

    # Create Organization
    org_res = db_client.post(
        "/api/v1/crm/organizations",
        json={"name": "Cyberdyne Research Labs", "domain": "cyberdyne.org", "description": "Robotics client"},
        headers=headers,
    )
    assert org_res.status_code == 201
    org = org_res.json()
    org_id = org["id"]
    assert org["name"] == "Cyberdyne Research Labs"

    # Create Contact associated with Organization
    contact_res = db_client.post(
        "/api/v1/crm/contacts",
        json={
            "name": "Miles Dyson",
            "email": "miles.dyson@cyberdyne.org",
            "phone": "+1 415-555-0199",
            "organization_id": org_id,
            "notes": "Director of Special Projects",
        },
        headers=headers,
    )
    assert contact_res.status_code == 201
    contact = contact_res.json()
    contact_id = contact["id"]
    assert contact["avatar_initials"] == "MD"
    assert contact["email"] == "miles.dyson@cyberdyne.org"

    # Search contacts
    search_res = db_client.get("/api/v1/crm/contacts?search=Miles", headers=headers)
    assert search_res.status_code == 200
    assert len(search_res.json()) >= 1
    assert search_res.json()[0]["id"] == contact_id


def test_public_forms_intake(db_client, auth_headers):
    headers = {"Authorization": auth_headers["Authorization"]}

    # Authenticated user creates a public intake form
    form_res = db_client.post(
        "/api/v1/public/forms",
        json={
            "slug": "contact-sales-form",
            "title": "Contact Enterprise Sales",
            "description": "Inquire about Enterprise SLA and dedicated clusters",
        },
        headers=headers,
    )
    assert form_res.status_code == 201
    form_slug = form_res.json()["slug"]

    # Public user retrieves the form schema (no auth header needed)
    get_res = db_client.get(f"/api/v1/public/forms/{form_slug}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Contact Enterprise Sales"

    # Public user submits the form
    sub_res = db_client.post(
        f"/api/v1/public/forms/{form_slug}/submit",
        json={
            "name": "John Connor",
            "email": "john.connor@future.org",
            "subject": "Enterprise licensing quote",
            "message": "We need 500 agent seats and 24/7 dedicated telephone support.",
        },
    )
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    assert sub_data["success"] is True
    assert "SD-" in sub_data["ticket_id"]


def test_webchat_visitor_init(db_client):
    # Visitor on a marketing website initializes web chat widget
    res = db_client.post(
        "/api/v1/public/chat/init",
        json={
            "tenant_slug": "crm-test-tenant",
            "visitor_name": "Anonymous Visitor",
            "visitor_email": "visitor@example.com",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert "visitor_token" in data
    assert "session_id" in data
    assert "welcome_message" in data


def test_inbound_webhooks(db_client):
    # Inbound Email webhook
    email_res = db_client.post(
        "/api/v1/channels/webhook/email/crm-test-tenant",
        json={
            "from": "customer@acme.com",
            "from_name": "Acme Customer",
            "subject": "Production Outage Urgent",
            "text": "Our API gateway is returning 502 Bad Gateway.",
        },
    )
    assert email_res.status_code == 200
    assert email_res.json()["status"] == "processed"
    assert "SD-" in email_res.json()["ticket_id"]

    # Inbound WhatsApp webhook
    wa_res = db_client.post(
        "/api/v1/channels/webhook/whatsapp/crm-test-tenant",
        json={
            "from_phone": "+15559876543",
            "message": "Hello, need help renewing my subscription plan.",
        },
    )
    assert wa_res.status_code == 200
    assert wa_res.json()["status"] == "processed"
    assert "SD-" in wa_res.json()["ticket_id"]


def test_notifications(db_client, auth_headers):
    headers = {"Authorization": auth_headers["Authorization"]}

    # Fetch notifications (empty initially or populated)
    list_res = db_client.get("/api/v1/notifications/", headers=headers)
    assert list_res.status_code == 200
    assert isinstance(list_res.json(), list)


def test_teams_full_lifecycle_and_rbac(db_client, auth_headers):
    headers = {"Authorization": auth_headers["Authorization"]}

    # Create team as agent
    res = db_client.post(
        "/api/v1/teams/",
        json={"name": "DevOps Operations", "description": "Cloud platform support"},
        headers=headers,
    )
    assert res.status_code == 201
    team = res.json()
    team_id = team["id"]
    assert team["name"] == "DevOps Operations"

    # Update team name and description
    patch_res = db_client.patch(
        f"/api/v1/teams/{team_id}",
        json={"name": "SRE & Cloud Ops", "description": "24/7 reliability engineering"},
        headers=headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "SRE & Cloud Ops"
    assert patch_res.json()["description"] == "24/7 reliability engineering"

    # Invalid name validation (< 2 characters)
    invalid_patch = db_client.patch(
        f"/api/v1/teams/{team_id}",
        json={"name": " "},
        headers=headers,
    )
    assert invalid_patch.status_code in (422, 400)

    # Assign member
    assign_res = db_client.post(
        f"/api/v1/teams/{team_id}/members/{auth_headers['user_id']}",
        headers=headers,
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["id"] == team_id

    # Remove member
    remove_res = db_client.delete(
        f"/api/v1/teams/{team_id}/members/{auth_headers['user_id']}",
        headers=headers,
    )
    assert remove_res.status_code == 200

    # Delete team
    del_res = db_client.delete(
        f"/api/v1/teams/{team_id}",
        headers=headers,
    )
    assert del_res.status_code == 204

    # Getting deleted team returns 404
    get_res = db_client.get(f"/api/v1/teams/{team_id}", headers=headers)
    assert get_res.status_code == 404

    # Role enforcement: Customer cannot create or modify teams
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "cust.team@example.com",
            "name": "Cust Team",
            "password": "Password123!",
            "role": "customer",
            "tenant_slug": "crm-test-tenant",
        },
    )
    cust_login = db_client.post(
        "/api/v1/auth/login",
        json={"email": "cust.team@example.com", "password": "Password123!", "tenant_slug": "crm-test-tenant"},
    )
    cust_token = cust_login.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    forbidden_create = db_client.post(
        "/api/v1/teams/",
        json={"name": "Customer Team"},
        headers=cust_headers,
    )
    assert forbidden_create.status_code == 403


def test_crm_full_lifecycle_validation_and_isolation(db_client, auth_headers):
    headers = {"Authorization": auth_headers["Authorization"]}

    # Create Organization
    org_res = db_client.post(
        "/api/v1/crm/organizations",
        json={"name": "Wayne Enterprises", "domain": "wayne.com", "description": "Gotham tech"},
        headers=headers,
    )
    assert org_res.status_code == 201
    org_id = org_res.json()["id"]

    # Update Organization
    patch_org = db_client.patch(
        f"/api/v1/crm/organizations/{org_id}",
        json={"name": "Wayne Technologies Inc.", "description": "Global R&D"},
        headers=headers,
    )
    assert patch_org.status_code == 200
    assert patch_org.json()["name"] == "Wayne Technologies Inc."

    # Create Contact
    contact_res = db_client.post(
        "/api/v1/crm/contacts",
        json={
            "name": "Bruce Wayne",
            "email": "bruce@wayne.com",
            "phone": "+1 555-0100",
            "organization_id": org_id,
        },
        headers=headers,
    )
    assert contact_res.status_code == 201
    contact_id = contact_res.json()["id"]
    assert contact_res.json()["avatar_initials"] == "BW"

    # Duplicate email in same workspace is rejected
    dup_res = db_client.post(
        "/api/v1/crm/contacts",
        json={
            "name": "Bruce Clone",
            "email": "bruce@wayne.com",
        },
        headers=headers,
    )
    assert dup_res.status_code == 400

    # Update Contact details (updates name & avatar initials)
    patch_contact = db_client.patch(
        f"/api/v1/crm/contacts/{contact_id}",
        json={"name": "Bruce T. Wayne", "phone": "+1 555-0199"},
        headers=headers,
    )
    assert patch_contact.status_code == 200
    assert patch_contact.json()["name"] == "Bruce T. Wayne"
    assert patch_contact.json()["avatar_initials"] == "BW"
    assert patch_contact.json()["phone"] == "+1 555-0199"

    # Delete Organization unlinks contact (sets organization_id to None)
    del_org = db_client.delete(f"/api/v1/crm/organizations/{org_id}", headers=headers)
    assert del_org.status_code == 204

    refreshed_contact = db_client.get(f"/api/v1/crm/contacts/{contact_id}", headers=headers)
    assert refreshed_contact.status_code == 200
    assert refreshed_contact.json()["organization_id"] is None

    # Delete contact
    del_contact = db_client.delete(f"/api/v1/crm/contacts/{contact_id}", headers=headers)
    assert del_contact.status_code == 204

    # 404 after deletion
    assert db_client.get(f"/api/v1/crm/contacts/{contact_id}", headers=headers).status_code == 404


def test_workspace_users_crud_and_rbac(db_client):
    # Register workspace admin
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "lead.admin@workspace.com",
            "name": "Lead Admin",
            "password": "Password123!",
            "role": "admin",
            "tenant_slug": "users-test-tenant",
        },
    )
    admin_login = db_client.post(
        "/api/v1/auth/login",
        json={"email": "lead.admin@workspace.com", "password": "Password123!", "tenant_slug": "users-test-tenant"},
    )
    admin_token = admin_login.json()["access_token"]
    admin_id = admin_login.json()["user"]["id"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin creates new agent directly in workspace
    create_res = db_client.post(
        "/api/v1/tenants/users",
        json={
            "email": "agent.smith@workspace.com",
            "name": "Agent Smith",
            "password": "Password123!",
            "role": "agent",
        },
        headers=admin_headers,
    )
    assert create_res.status_code == 201
    new_user = create_res.json()
    new_user_id = new_user["id"]
    assert new_user["email"] == "agent.smith@workspace.com"
    assert new_user["role"] == "agent"

    # Duplicate email rejected
    dup_res = db_client.post(
        "/api/v1/tenants/users",
        json={
            "email": "agent.smith@workspace.com",
            "name": "Duplicate Agent",
            "password": "Password123!",
            "role": "agent",
        },
        headers=admin_headers,
    )
    assert dup_res.status_code == 400

    # List workspace users
    list_res = db_client.get("/api/v1/tenants/users", headers=admin_headers)
    assert list_res.status_code == 200
    users = list_res.json()
    assert len(users) >= 2
    assert any(u["id"] == new_user_id for u in users)

    # Get single user
    get_res = db_client.get(f"/api/v1/tenants/users/{new_user_id}", headers=admin_headers)
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Agent Smith"

    # Admin updates user
    patch_res = db_client.patch(
        f"/api/v1/tenants/users/{new_user_id}",
        json={"name": "Agent J. Smith", "phone": "+1 800-555-1212"},
        headers=admin_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Agent J. Smith"
    assert patch_res.json()["phone"] == "+1 800-555-1212"

    # Agent attempts to escalate role to admin -> 403 Forbidden
    agent_login = db_client.post(
        "/api/v1/auth/login",
        json={"email": "agent.smith@workspace.com", "password": "Password123!", "tenant_slug": "users-test-tenant"},
    )
    agent_token = agent_login.json()["access_token"]
    agent_headers = {"Authorization": f"Bearer {agent_token}"}

    escalate_res = db_client.patch(
        f"/api/v1/tenants/users/{new_user_id}",
        json={"role": "admin"},
        headers=agent_headers,
    )
    assert escalate_res.status_code == 403

    # Admin self-demotion prevented
    self_demote = db_client.patch(
        f"/api/v1/tenants/users/{admin_id}",
        json={"role": "customer"},
        headers=admin_headers,
    )
    assert self_demote.status_code == 400

    # Admin self-deletion prevented
    self_del = db_client.delete(f"/api/v1/tenants/users/{admin_id}", headers=admin_headers)
    assert self_del.status_code == 400

    # Admin deletes agent
    del_res = db_client.delete(f"/api/v1/tenants/users/{new_user_id}", headers=admin_headers)
    assert del_res.status_code == 204

    # Deleted user returns 404
    assert db_client.get(f"/api/v1/tenants/users/{new_user_id}", headers=admin_headers).status_code == 404


def test_channels_full_crud_masking_and_rbac(db_client, auth_headers):
    headers = {"Authorization": auth_headers["Authorization"]}

    # Create channel with sensitive secrets in config_json
    sensitive_config = json.dumps({
        "provider": "ses",
        "api_key": "live_secret_key_12345",
        "webhook_secret": "my_super_secret_value",
        "email": "support@example.com",
    })
    res = db_client.post(
        "/api/v1/channels/",
        json={
            "name": "Production Inbound SES",
            "type": "email",
            "is_active": True,
            "config_json": sensitive_config,
        },
        headers=headers,
    )
    assert res.status_code == 201
    channel = res.json()
    channel_id = channel["id"]
    assert channel["name"] == "Production Inbound SES"

    # Verify secrets are masked in response
    assert "live_secret_key_12345" not in channel["config_json"]
    assert "my_super_secret_value" not in channel["config_json"]
    assert "***2345" in channel["config_json"] or "********" in channel["config_json"]

    # List channels masks secrets
    list_res = db_client.get("/api/v1/channels/", headers=headers)
    assert list_res.status_code == 200
    found = next(c for c in list_res.json() if c["id"] == channel_id)
    assert "live_secret_key_12345" not in found["config_json"]

    # Get single channel masks secrets
    get_res = db_client.get(f"/api/v1/channels/{channel_id}", headers=headers)
    assert get_res.status_code == 200
    assert "live_secret_key_12345" not in get_res.json()["config_json"]

    # Update channel name and deactivate
    patch_res = db_client.patch(
        f"/api/v1/channels/{channel_id}",
        json={"name": "Disabled SES Channel", "is_active": False},
        headers=headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Disabled SES Channel"
    assert patch_res.json()["is_active"] is False

    # Validation: invalid config JSON rejected with 422
    invalid_json_res = db_client.patch(
        f"/api/v1/channels/{channel_id}",
        json={"config_json": "not a json string"},
        headers=headers,
    )
    assert invalid_json_res.status_code == 422

    # Validation: short name rejected with 422
    invalid_name_res = db_client.patch(
        f"/api/v1/channels/{channel_id}",
        json={"name": "x"},
        headers=headers,
    )
    assert invalid_name_res.status_code == 422

    # Delete channel
    del_res = db_client.delete(f"/api/v1/channels/{channel_id}", headers=headers)
    assert del_res.status_code == 204

    # Deleted channel returns 404
    assert db_client.get(f"/api/v1/channels/{channel_id}", headers=headers).status_code == 404

    # RBAC: customer is forbidden from channel operations and public form creation
    cust_login = db_client.post(
        "/api/v1/auth/login",
        json={"email": "cust.team@example.com", "password": "Password123!", "tenant_slug": "crm-test-tenant"},
    )
    cust_token = cust_login.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    forbidden_chan = db_client.post(
        "/api/v1/channels/",
        json={"name": "Hacked Channel", "type": "email"},
        headers=cust_headers,
    )
    assert forbidden_chan.status_code == 403

    forbidden_form = db_client.post(
        "/api/v1/public/forms",
        json={"slug": "hacked-form", "title": "Hacked Form"},
        headers=cust_headers,
    )
    assert forbidden_form.status_code == 403

