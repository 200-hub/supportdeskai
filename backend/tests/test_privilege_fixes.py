"""Regression tests for privilege-escalation and multi-tenant bugs."""
from app.core.config import settings

PW = "Password123!"


def _register(c, email, role, slug):
    return c.post("/api/v1/auth/register", json={
        "email": email, "name": "Test User", "password": PW, "role": role, "tenant_slug": slug,
    })


def _token(c, email, role, slug):
    res = _register(c, email, role, slug)
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_staff_self_registration_needs_invite(db_client, monkeypatch):
    monkeypatch.setattr(settings, "ALLOW_STAFF_SELF_REGISTRATION", False)
    # Founder of a brand-new workspace may be admin.
    assert _register(db_client, "founder@priv1.com", "admin", "priv-one").status_code == 201
    # Joining that existing workspace as staff is refused; as customer is fine.
    assert _register(db_client, "evil@priv1.com", "admin", "priv-one").status_code == 403
    assert _register(db_client, "evil2@priv1.com", "agent", "priv-one").status_code == 403
    assert _register(db_client, "cust@priv1.com", "customer", "priv-one").status_code == 201


def test_agent_cannot_invite_admin(db_client):
    _token(db_client, "admin@priv2.com", "admin", "priv-two")
    agent = _token(db_client, "agent@priv2.com", "agent", "priv-two")
    res = db_client.post("/api/v1/tenants/invite", json={"email": "x@priv2.com", "role": "admin"}, headers=agent)
    assert res.status_code == 403
    res = db_client.post("/api/v1/tenants/invite", json={"email": "y@priv2.com", "role": "agent"}, headers=agent)
    assert res.status_code == 201


def test_sender_type_follows_role_and_crm_is_staff_only(db_client):
    cust = _token(db_client, "cust@priv3.com", "customer", "priv-three")
    agent = _token(db_client, "agent@priv3.com", "agent", "priv-three")
    tid = db_client.post("/api/v1/tickets/", json={"subject": "Help", "description": "Broken thing"},
                         headers=cust).json()["id"]

    spoof = db_client.post(f"/api/v1/tickets/{tid}/messages",
                           json={"content": "I am support", "sender_type": "agent"}, headers=cust)
    assert spoof.status_code == 201 and spoof.json()["sender_type"] == "customer"

    reply = db_client.post(f"/api/v1/tickets/{tid}/messages", json={"content": "On it"}, headers=agent)
    assert reply.status_code == 201 and reply.json()["sender_type"] == "agent"

    # Customers can't touch staff-only ticket fields.
    assert db_client.patch(f"/api/v1/tickets/{tid}", json={"sla_status": "met"}, headers=cust).status_code == 403

    assert db_client.get("/api/v1/crm/contacts", headers=cust).status_code == 403
    assert db_client.get("/api/v1/crm/contacts", headers=agent).status_code == 200


def test_knowledge_base_works_for_second_tenant(db_client):
    for i in (1, 2):
        h = _token(db_client, f"kb{i}@priv4.com", "customer", f"priv-kb-{i}")
        res = db_client.get("/api/v1/knowledge/articles", headers=h)
        assert res.status_code == 200 and len(res.json()) > 0
