"""
Tenant Isolation Regression Tests
==================================
Creates two independent tenants and verifies that users from Tenant B cannot
read, write, enumerate, or modify resources belonging to Tenant A across every
module in scope: tickets, CRM, teams, channels, SLA, routing, macros,
automations, and messages (including internal-note visibility for customers).

All cross-tenant attempts must return 403 or 404 (never 200 with another
tenant's data). Public/webhook endpoints are tested separately with correct
tenant-scoping assertions.
"""
import pytest


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _register_and_login(db_client, email: str, name: str, password: str, role: str, tenant_slug: str) -> str:
    """Register a user (or skip duplicate) and return a valid Bearer token."""
    db_client.post(
        "/api/v1/auth/register",
        json={"email": email, "name": name, "password": password, "role": role, "tenant_slug": tenant_slug},
    )
    login = db_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password, "tenant_slug": tenant_slug},
    )
    assert login.status_code == 200, f"Login failed for {email}: {login.text}"
    return login.json()["access_token"]


def _hdrs(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Tenant fixture — two isolated tenants with one agent each
# ---------------------------------------------------------------------------

@pytest.fixture
def two_tenants(db_client):
    """Returns dict with 'a' and 'b' keys, each holding {token, agent_token}."""
    tok_a = _register_and_login(db_client, "admin@alpha-corp.io", "Alpha Admin", "Password123!", "admin", "alpha-corp")
    tok_b = _register_and_login(db_client, "admin@beta-corp.io", "Beta Admin", "Password123!", "admin", "beta-corp")
    return {"a": {"token": tok_a}, "b": {"token": tok_b}}


# ---------------------------------------------------------------------------
# 1. Tickets
# ---------------------------------------------------------------------------

class TestTicketIsolation:

    def _create_ticket(self, db_client, token: str, subject: str = "Isolation Test Ticket") -> str:
        res = db_client.post(
            "/api/v1/tickets/",
            json={"subject": subject, "description": "Testing isolation"},
            headers=_hdrs(token),
        )
        assert res.status_code == 201, res.text
        return res.json()["id"]

    def test_cross_tenant_ticket_read(self, db_client, two_tenants):
        """Tenant B cannot read a ticket belonging to Tenant A."""
        ticket_a = self._create_ticket(db_client, two_tenants["a"]["token"])
        res = db_client.get(f"/api/v1/tickets/{ticket_a}", headers=_hdrs(two_tenants["b"]["token"]))
        assert res.status_code == 404, (
            f"Expected 404 but got {res.status_code}: {res.text}"
        )

    def test_cross_tenant_ticket_update(self, db_client, two_tenants):
        """Tenant B cannot update a ticket belonging to Tenant A."""
        ticket_a = self._create_ticket(db_client, two_tenants["a"]["token"])
        res = db_client.patch(
            f"/api/v1/tickets/{ticket_a}",
            json={"status": "closed"},
            headers=_hdrs(two_tenants["b"]["token"]),
        )
        assert res.status_code == 404, f"Expected 404 got {res.status_code}: {res.text}"

    def test_cross_tenant_ticket_delete(self, db_client, two_tenants):
        """Tenant B cannot soft-delete a ticket belonging to Tenant A."""
        ticket_a = self._create_ticket(db_client, two_tenants["a"]["token"])
        res = db_client.delete(f"/api/v1/tickets/{ticket_a}", headers=_hdrs(two_tenants["b"]["token"]))
        assert res.status_code == 404, f"Expected 404 got {res.status_code}: {res.text}"

    def test_cross_tenant_ticket_messages_read(self, db_client, two_tenants):
        """Tenant B cannot read messages of a ticket belonging to Tenant A."""
        ticket_a = self._create_ticket(db_client, two_tenants["a"]["token"])
        res = db_client.get(
            f"/api/v1/tickets/{ticket_a}/messages",
            headers=_hdrs(two_tenants["b"]["token"]),
        )
        assert res.status_code == 404, f"Expected 404 got {res.status_code}: {res.text}"

    def test_cross_tenant_ticket_message_write(self, db_client, two_tenants):
        """Tenant B cannot post a message to a ticket belonging to Tenant A."""
        ticket_a = self._create_ticket(db_client, two_tenants["a"]["token"])
        res = db_client.post(
            f"/api/v1/tickets/{ticket_a}/messages",
            json={"content": "Intruder reply", "sender_type": "agent"},
            headers=_hdrs(two_tenants["b"]["token"]),
        )
        assert res.status_code == 404, f"Expected 404 got {res.status_code}: {res.text}"

    def test_cross_tenant_ticket_merge(self, db_client, two_tenants):
        """Tenant B cannot merge a ticket from Tenant A into its own tickets."""
        ticket_a = self._create_ticket(db_client, two_tenants["a"]["token"], "Source A")
        ticket_b = self._create_ticket(db_client, two_tenants["b"]["token"], "Target B")
        # B tries to merge A's ticket into B's ticket (source is cross-tenant)
        res = db_client.post(
            f"/api/v1/tickets/{ticket_a}/merge/{ticket_b}",
            headers=_hdrs(two_tenants["b"]["token"]),
        )
        assert res.status_code == 404, f"Expected 404 got {res.status_code}: {res.text}"

    def test_cross_tenant_collision_write(self, db_client, two_tenants):
        """Tenant B cannot write collision state for Tenant A's ticket."""
        ticket_a = self._create_ticket(db_client, two_tenants["a"]["token"])
        res = db_client.post(
            f"/api/v1/tickets/{ticket_a}/collision?is_typing=true",
            headers=_hdrs(two_tenants["b"]["token"]),
        )
        assert res.status_code == 404, f"Expected 404 got {res.status_code}: {res.text}"

    def test_cross_tenant_collision_read(self, db_client, two_tenants):
        """Tenant B cannot read collision state for Tenant A's ticket."""
        ticket_a = self._create_ticket(db_client, two_tenants["a"]["token"])
        res = db_client.get(
            f"/api/v1/tickets/{ticket_a}/collision",
            headers=_hdrs(two_tenants["b"]["token"]),
        )
        assert res.status_code == 404, f"Expected 404 got {res.status_code}: {res.text}"

    def test_ticket_list_does_not_leak_cross_tenant(self, db_client, two_tenants):
        """Tenant B's ticket list must not include tickets created by Tenant A."""
        subject_a = "ALPHA_SUPER_SECRET_TICKET"
        self._create_ticket(db_client, two_tenants["a"]["token"], subject_a)
        list_b = db_client.get("/api/v1/tickets/", headers=_hdrs(two_tenants["b"]["token"]))
        assert list_b.status_code == 200
        ids_b = {t["id"] for t in list_b.json().get("tickets", [])}
        subjects_b = {t["subject"] for t in list_b.json().get("tickets", [])}
        assert subject_a not in subjects_b, "Tenant A ticket leaked into Tenant B list response"

    def test_cross_tenant_team_assignment_in_ticket(self, db_client, two_tenants):
        """Tenant A cannot assign a team from Tenant B to its ticket."""
        ticket_a = self._create_ticket(db_client, two_tenants["a"]["token"])
        team_b_res = db_client.post(
            "/api/v1/teams/",
            json={"name": "Tenant B Isolated Team"},
            headers=_hdrs(two_tenants["b"]["token"]),
        )
        assert team_b_res.status_code == 201
        team_b_id = team_b_res.json()["id"]

        patch_res = db_client.patch(
            f"/api/v1/tickets/{ticket_a}",
            json={"team_id": team_b_id},
            headers=_hdrs(two_tenants["a"]["token"]),
        )
        assert patch_res.status_code == 404


# ---------------------------------------------------------------------------
# 2. Internal note visibility for customers
# ---------------------------------------------------------------------------

class TestInternalNoteVisibility:

    def test_customer_cannot_see_internal_notes(self, db_client):
        """A customer must never receive internal notes in their message list."""
        # Register an agent and a customer in the same tenant
        agent_tok = _register_and_login(db_client, "note.agent@omega.io", "Note Agent", "Password123!", "agent", "omega-notes")
        cust_tok = _register_and_login(db_client, "note.cust@omega.io", "Note Customer", "Password123!", "customer", "omega-notes")

        # Customer opens a ticket
        ticket_res = db_client.post(
            "/api/v1/tickets/",
            json={"subject": "Need Help", "description": "Please assist"},
            headers=_hdrs(cust_tok),
        )
        assert ticket_res.status_code == 201
        ticket_id = ticket_res.json()["id"]

        # Agent posts an internal note
        note_res = db_client.post(
            f"/api/v1/tickets/{ticket_id}/messages",
            json={"content": "INTERNAL: escalate to L3", "sender_type": "internal_note"},
            headers=_hdrs(agent_tok),
        )
        assert note_res.status_code == 201

        # Customer fetches messages — must NOT see the internal note
        msgs_res = db_client.get(f"/api/v1/tickets/{ticket_id}/messages", headers=_hdrs(cust_tok))
        assert msgs_res.status_code == 200
        contents = [m["content"] for m in msgs_res.json()]
        assert "INTERNAL: escalate to L3" not in contents, (
            "Internal note was exposed to a customer!"
        )


# ---------------------------------------------------------------------------
# 3. CRM — Contacts & Organizations
# ---------------------------------------------------------------------------

class TestCRMIsolation:

    def _create_org(self, db_client, token: str, name: str) -> str:
        res = db_client.post(
            "/api/v1/crm/organizations",
            json={"name": name, "domain": f"{name.lower().replace(' ', '')}.test"},
            headers=_hdrs(token),
        )
        assert res.status_code == 201, res.text
        return res.json()["id"]

    def _create_contact(self, db_client, token: str, name: str, email: str) -> str:
        res = db_client.post(
            "/api/v1/crm/contacts",
            json={"name": name, "email": email},
            headers=_hdrs(token),
        )
        assert res.status_code == 201, res.text
        return res.json()["id"]

    def test_cross_tenant_org_read(self, db_client, two_tenants):
        """Tenant B cannot read an org record belonging to Tenant A."""
        org_id = self._create_org(db_client, two_tenants["a"]["token"], "Alpha Org Secret")
        res = db_client.get(f"/api/v1/crm/organizations/{org_id}", headers=_hdrs(two_tenants["b"]["token"]))
        assert res.status_code == 404, f"Expected 404 got {res.status_code}: {res.text}"

    def test_cross_tenant_contact_read(self, db_client, two_tenants):
        """Tenant B cannot read a contact record belonging to Tenant A."""
        contact_id = self._create_contact(db_client, two_tenants["a"]["token"], "Secret Contact A", "secret.a@alpha.io")
        res = db_client.get(f"/api/v1/crm/contacts/{contact_id}", headers=_hdrs(two_tenants["b"]["token"]))
        assert res.status_code == 404, f"Expected 404 got {res.status_code}: {res.text}"

    def test_org_list_does_not_leak_cross_tenant(self, db_client, two_tenants):
        """Tenant A's organizations must not appear in Tenant B's listing."""
        secret_name = "ALPHA_SECRET_ORG_XYZZY"
        self._create_org(db_client, two_tenants["a"]["token"], secret_name)
        list_res = db_client.get("/api/v1/crm/organizations", headers=_hdrs(two_tenants["b"]["token"]))
        assert list_res.status_code == 200
        names = [o["name"] for o in list_res.json()]
        assert secret_name not in names, "Cross-tenant org data leaked into Tenant B listing"

    def test_contact_list_does_not_leak_cross_tenant(self, db_client, two_tenants):
        """Tenant A's contacts must not appear in Tenant B's listing."""
        secret_email = "secret.leak@alpha-iso.io"
        self._create_contact(db_client, two_tenants["a"]["token"], "Secret Leak A", secret_email)
        list_res = db_client.get("/api/v1/crm/contacts", headers=_hdrs(two_tenants["b"]["token"]))
        assert list_res.status_code == 200
        emails = [c["email"] for c in list_res.json()]
        assert secret_email not in emails, "Cross-tenant contact data leaked into Tenant B listing"

    def test_cross_tenant_org_update(self, db_client, two_tenants):
        """Tenant B cannot update an org record belonging to Tenant A."""
        org_id = self._create_org(db_client, two_tenants["a"]["token"], "Alpha Org To Update")
        res = db_client.patch(
            f"/api/v1/crm/organizations/{org_id}",
            json={"name": "Tampered By B"},
            headers=_hdrs(two_tenants["b"]["token"]),
        )
        assert res.status_code == 404, f"Expected 404 got {res.status_code}: {res.text}"

    def test_cross_tenant_org_delete(self, db_client, two_tenants):
        """Tenant B cannot delete an org record belonging to Tenant A."""
        org_id = self._create_org(db_client, two_tenants["a"]["token"], "Alpha Org To Delete")
        res = db_client.delete(f"/api/v1/crm/organizations/{org_id}", headers=_hdrs(two_tenants["b"]["token"]))
        assert res.status_code == 404, f"Expected 404 got {res.status_code}: {res.text}"

    def test_cross_tenant_contact_update(self, db_client, two_tenants):
        """Tenant B cannot update a contact record belonging to Tenant A."""
        contact_id = self._create_contact(db_client, two_tenants["a"]["token"], "Alpha Contact Update", "upd@alpha.io")
        res = db_client.patch(
            f"/api/v1/crm/contacts/{contact_id}",
            json={"name": "Tampered Contact"},
            headers=_hdrs(two_tenants["b"]["token"]),
        )
        assert res.status_code == 404, f"Expected 404 got {res.status_code}: {res.text}"

    def test_cross_tenant_contact_delete(self, db_client, two_tenants):
        """Tenant B cannot delete a contact record belonging to Tenant A."""
        contact_id = self._create_contact(db_client, two_tenants["a"]["token"], "Alpha Contact Del", "del@alpha.io")
        res = db_client.delete(f"/api/v1/crm/contacts/{contact_id}", headers=_hdrs(two_tenants["b"]["token"]))
        assert res.status_code == 404, f"Expected 404 got {res.status_code}: {res.text}"

    def test_cross_tenant_contact_org_fk_rejected(self, db_client, two_tenants):
        """Tenant A cannot link contact to Tenant B's organization."""
        org_b = self._create_org(db_client, two_tenants["b"]["token"], "Beta Org Isolated")
        contact_id = self._create_contact(db_client, two_tenants["a"]["token"], "Alpha Contact FK", "fk@alpha.io")
        res = db_client.patch(
            f"/api/v1/crm/contacts/{contact_id}",
            json={"organization_id": org_b},
            headers=_hdrs(two_tenants["a"]["token"]),
        )
        assert res.status_code == 404


# ---------------------------------------------------------------------------
# 4. Teams
# ---------------------------------------------------------------------------

class TestTeamIsolation:

    def _create_team(self, db_client, token: str, name: str) -> str:
        res = db_client.post(
            "/api/v1/teams/",
            json={"name": name, "description": "Isolation test team"},
            headers=_hdrs(token),
        )
        assert res.status_code == 201, res.text
        return res.json()["id"]

    def test_cross_tenant_team_read(self, db_client, two_tenants):
        """Tenant B cannot read a team belonging to Tenant A."""
        team_id = self._create_team(db_client, two_tenants["a"]["token"], "Alpha Secret Team")
        res = db_client.get(f"/api/v1/teams/{team_id}", headers=_hdrs(two_tenants["b"]["token"]))
        assert res.status_code == 404, f"Expected 404 got {res.status_code}: {res.text}"

    def test_team_list_does_not_leak_cross_tenant(self, db_client, two_tenants):
        """Tenant A's teams must not appear in Tenant B's listing."""
        secret_name = "ALPHA_SECRET_TEAM_XYZZY"
        self._create_team(db_client, two_tenants["a"]["token"], secret_name)
        list_res = db_client.get("/api/v1/teams/", headers=_hdrs(two_tenants["b"]["token"]))
        assert list_res.status_code == 200
        names = [t["name"] for t in list_res.json()]
        assert secret_name not in names, "Cross-tenant team data leaked into Tenant B listing"

    def test_cross_tenant_team_update(self, db_client, two_tenants):
        """Tenant B cannot update a team belonging to Tenant A."""
        team_id = self._create_team(db_client, two_tenants["a"]["token"], "Alpha Team To Update")
        res = db_client.patch(
            f"/api/v1/teams/{team_id}",
            json={"name": "Tampered Team"},
            headers=_hdrs(two_tenants["b"]["token"]),
        )
        assert res.status_code == 404, f"Expected 404 got {res.status_code}: {res.text}"

    def test_cross_tenant_team_delete(self, db_client, two_tenants):
        """Tenant B cannot delete a team belonging to Tenant A."""
        team_id = self._create_team(db_client, two_tenants["a"]["token"], "Alpha Team To Delete")
        res = db_client.delete(f"/api/v1/teams/{team_id}", headers=_hdrs(two_tenants["b"]["token"]))
        assert res.status_code == 404, f"Expected 404 got {res.status_code}: {res.text}"


# ---------------------------------------------------------------------------
# Workspace Users Isolation
# ---------------------------------------------------------------------------

class TestWorkspaceUsersIsolation:

    def test_cross_tenant_user_list_isolation(self, db_client, two_tenants):
        """Tenant B cannot see users of Tenant A."""
        res_a = db_client.get("/api/v1/tenants/users", headers=_hdrs(two_tenants["a"]["token"]))
        assert res_a.status_code == 200
        emails_a = {u["email"] for u in res_a.json()}

        res_b = db_client.get("/api/v1/tenants/users", headers=_hdrs(two_tenants["b"]["token"]))
        assert res_b.status_code == 200
        emails_b = {u["email"] for u in res_b.json()}

        assert not (emails_a & emails_b), "Tenant user lists intersected across boundaries"

    def test_cross_tenant_user_get_rejected(self, db_client, two_tenants):
        """Tenant B cannot retrieve Tenant A's user details."""
        res_a = db_client.get("/api/v1/tenants/users", headers=_hdrs(two_tenants["a"]["token"]))
        user_a_id = res_a.json()[0]["id"]
        res = db_client.get(f"/api/v1/tenants/users/{user_a_id}", headers=_hdrs(two_tenants["b"]["token"]))
        assert res.status_code == 404

    def test_cross_tenant_user_update_rejected(self, db_client, two_tenants):
        """Tenant B cannot update Tenant A's user."""
        res_a = db_client.get("/api/v1/tenants/users", headers=_hdrs(two_tenants["a"]["token"]))
        user_a_id = res_a.json()[0]["id"]
        res = db_client.patch(
            f"/api/v1/tenants/users/{user_a_id}",
            json={"name": "Hacked User"},
            headers=_hdrs(two_tenants["b"]["token"]),
        )
        assert res.status_code == 404

    def test_cross_tenant_user_delete_rejected(self, db_client, two_tenants):
        """Tenant B cannot delete Tenant A's user."""
        res_a = db_client.get("/api/v1/tenants/users", headers=_hdrs(two_tenants["a"]["token"]))
        user_a_id = res_a.json()[0]["id"]
        res = db_client.delete(f"/api/v1/tenants/users/{user_a_id}", headers=_hdrs(two_tenants["b"]["token"]))
        assert res.status_code == 404


# ---------------------------------------------------------------------------
# Channels Isolation
# ---------------------------------------------------------------------------

class TestChannelIsolation:

    def _create_channel(self, db_client, token: str, name: str) -> str:
        res = db_client.post(
            "/api/v1/channels/",
            json={"name": name, "type": "email", "is_active": True},
            headers=_hdrs(token),
        )
        assert res.status_code == 201, res.text
        return res.json()["id"]

    def test_cross_tenant_channel_read(self, db_client, two_tenants):
        """Tenant B cannot read a channel belonging to Tenant A."""
        chan_id = self._create_channel(db_client, two_tenants["a"]["token"], "Alpha Secret Channel")
        res = db_client.get(f"/api/v1/channels/{chan_id}", headers=_hdrs(two_tenants["b"]["token"]))
        assert res.status_code == 404

    def test_channel_list_does_not_leak_cross_tenant(self, db_client, two_tenants):
        """Tenant A's channels must not appear in Tenant B's listing."""
        secret_name = "ALPHA_SECRET_CHAN_XYZ"
        self._create_channel(db_client, two_tenants["a"]["token"], secret_name)
        list_res = db_client.get("/api/v1/channels/", headers=_hdrs(two_tenants["b"]["token"]))
        assert list_res.status_code == 200
        names = [c["name"] for c in list_res.json()]
        assert secret_name not in names, "Cross-tenant channel leaked into Tenant B listing"

    def test_cross_tenant_channel_update(self, db_client, two_tenants):
        """Tenant B cannot update a channel belonging to Tenant A."""
        chan_id = self._create_channel(db_client, two_tenants["a"]["token"], "Alpha Chan To Update")
        res = db_client.patch(
            f"/api/v1/channels/{chan_id}",
            json={"name": "Tampered Chan"},
            headers=_hdrs(two_tenants["b"]["token"]),
        )
        assert res.status_code == 404

    def test_cross_tenant_channel_delete(self, db_client, two_tenants):
        """Tenant B cannot delete a channel belonging to Tenant A."""
        chan_id = self._create_channel(db_client, two_tenants["a"]["token"], "Alpha Chan To Delete")
        res = db_client.delete(f"/api/v1/channels/{chan_id}", headers=_hdrs(two_tenants["b"]["token"]))
        assert res.status_code == 404


# ---------------------------------------------------------------------------
# 5. SLA Policies
# ---------------------------------------------------------------------------

class TestSLAIsolation:

    def _create_policy(self, db_client, token: str, name: str) -> str:
        res = db_client.post(
            "/api/v1/sla/policies",
            json={
                "name": name,
                "priority": "high",
                "first_response_time_minutes": 30,
                "resolution_time_minutes": 240,
                "business_hours_only": False,
                "is_active": True,
            },
            headers=_hdrs(token),
        )
        assert res.status_code == 201, res.text
        return res.json()["id"]

    def test_cross_tenant_sla_update(self, db_client, two_tenants):
        """Tenant B cannot update an SLA policy belonging to Tenant A."""
        policy_id = self._create_policy(db_client, two_tenants["a"]["token"], "Alpha SLA Secret")
        res = db_client.patch(
            f"/api/v1/sla/policies/{policy_id}",
            json={
                "name": "Hijacked SLA",
                "priority": "low",
                "first_response_time_minutes": 9999,
                "resolution_time_minutes": 9999,
                "business_hours_only": False,
                "is_active": False,
            },
            headers=_hdrs(two_tenants["b"]["token"]),
        )
        assert res.status_code == 404, f"Expected 404 got {res.status_code}: {res.text}"

    def test_sla_list_does_not_leak_cross_tenant(self, db_client, two_tenants):
        """Tenant A's SLA policies must not appear in Tenant B's listing."""
        secret_name = "ALPHA_SECRET_SLA_XYZZY"
        self._create_policy(db_client, two_tenants["a"]["token"], secret_name)
        list_res = db_client.get("/api/v1/sla/policies", headers=_hdrs(two_tenants["b"]["token"]))
        assert list_res.status_code == 200
        names = [p["name"] for p in list_res.json()]
        assert secret_name not in names, "Cross-tenant SLA policy leaked into Tenant B listing"


# ---------------------------------------------------------------------------
# 6. Routing Rules
# ---------------------------------------------------------------------------

class TestRoutingIsolation:

    def _create_rule(self, db_client, token: str, name: str) -> str:
        res = db_client.post(
            "/api/v1/routing/rules",
            json={"name": name, "strategy": "round_robin", "is_active": True, "priority_order": 1},
            headers=_hdrs(token),
        )
        assert res.status_code == 201, res.text
        return res.json()["id"]

    def test_routing_list_does_not_leak_cross_tenant(self, db_client, two_tenants):
        """Tenant A's routing rules must not appear in Tenant B's listing."""
        secret_name = "ALPHA_SECRET_ROUTING_XYZZY"
        self._create_rule(db_client, two_tenants["a"]["token"], secret_name)
        list_res = db_client.get("/api/v1/routing/rules", headers=_hdrs(two_tenants["b"]["token"]))
        assert list_res.status_code == 200
        names = [r["name"] for r in list_res.json()]
        assert secret_name not in names, "Cross-tenant routing rule leaked into Tenant B listing"


# ---------------------------------------------------------------------------
# 7. Macros
# ---------------------------------------------------------------------------

class TestMacroIsolation:

    def _create_macro(self, db_client, token: str, title: str) -> str:
        res = db_client.post(
            "/api/v1/macros/",
            json={"title": title, "description": "Isolation test macro", "actions": {}, "is_active": True},
            headers=_hdrs(token),
        )
        assert res.status_code == 201, res.text
        return res.json()["id"]

    def test_macro_list_does_not_leak_cross_tenant(self, db_client, two_tenants):
        """Tenant A's macros must not appear in Tenant B's listing."""
        secret_title = "ALPHA_SECRET_MACRO_XYZZY"
        self._create_macro(db_client, two_tenants["a"]["token"], secret_title)
        list_res = db_client.get("/api/v1/macros/", headers=_hdrs(two_tenants["b"]["token"]))
        assert list_res.status_code == 200
        titles = [m["title"] for m in list_res.json()]
        assert secret_title not in titles, "Cross-tenant macro leaked into Tenant B listing"

    def test_cross_tenant_macro_apply(self, db_client, two_tenants):
        """Tenant B cannot apply Tenant A's macro to its own ticket (or vice versa)."""
        macro_id_a = self._create_macro(db_client, two_tenants["a"]["token"], "Alpha Macro X")
        # Tenant B creates a ticket and tries to apply Tenant A's macro
        ticket_res = db_client.post(
            "/api/v1/tickets/",
            json={"subject": "B Ticket For Macro Test", "description": "test"},
            headers=_hdrs(two_tenants["b"]["token"]),
        )
        assert ticket_res.status_code == 201
        ticket_b_id = ticket_res.json()["id"]

        res = db_client.post(
            f"/api/v1/macros/{macro_id_a}/apply/{ticket_b_id}",
            headers=_hdrs(two_tenants["b"]["token"]),
        )
        # Macro from Tenant A not found for Tenant B — expect 404
        assert res.status_code == 404, f"Expected 404 got {res.status_code}: {res.text}"


# ---------------------------------------------------------------------------
# 8. Automations
# ---------------------------------------------------------------------------

class TestAutomationIsolation:

    def _create_automation(self, db_client, token: str, name: str) -> str:
        res = db_client.post(
            "/api/v1/automations/",
            json={
                "name": name,
                "trigger_event": "ticket_created",
                "conditions": [],
                "actions": [],
                "is_active": True,
            },
            headers=_hdrs(token),
        )
        assert res.status_code == 201, res.text
        return res.json()["id"]

    def test_automation_list_does_not_leak_cross_tenant(self, db_client, two_tenants):
        """Tenant A's automation rules must not appear in Tenant B's listing."""
        secret_name = "ALPHA_SECRET_AUTOMATION_XYZZY"
        self._create_automation(db_client, two_tenants["a"]["token"], secret_name)
        list_res = db_client.get("/api/v1/automations/", headers=_hdrs(two_tenants["b"]["token"]))
        assert list_res.status_code == 200
        names = [a["name"] for a in list_res.json()]
        assert secret_name not in names, "Cross-tenant automation leaked into Tenant B listing"

    def test_cross_tenant_automation_execute(self, db_client, two_tenants):
        """Tenant B cannot trigger automation execution on Tenant A's ticket."""
        ticket_res = db_client.post(
            "/api/v1/tickets/",
            json={"subject": "Alpha Automation Ticket", "description": "test"},
            headers=_hdrs(two_tenants["a"]["token"]),
        )
        ticket_a_id = ticket_res.json()["id"]

        # Tenant B tries to execute automations on Tenant A's ticket
        res = db_client.post(
            f"/api/v1/automations/execute/{ticket_a_id}?event_type=ticket_created",
            headers=_hdrs(two_tenants["b"]["token"]),
        )
        # Ticket not found for Tenant B → empty result or 200 with empty list (not 200 with data)
        # The service returns [] when ticket is not found — verify no data leakage
        assert res.status_code == 200
        assert res.json() == [], (
            f"Tenant B received non-empty automation result for Tenant A's ticket: {res.json()}"
        )


# ---------------------------------------------------------------------------
# 9. Workspace / Tenant settings
# ---------------------------------------------------------------------------

class TestWorkspaceIsolation:

    def test_workspace_update_scoped_to_own_tenant(self, db_client, two_tenants):
        """Tenant B updating /tenants/current only modifies its own workspace."""
        db_client.patch(
            "/api/v1/tenants/current",
            json={"name": "Alpha Corp (Original)"},
            headers=_hdrs(two_tenants["a"]["token"]),
        )

        # Tenant B updates its own workspace name
        db_client.patch(
            "/api/v1/tenants/current",
            json={"name": "Beta Corp Updated"},
            headers=_hdrs(two_tenants["b"]["token"]),
        )

        # Tenant A's workspace must be unchanged
        ws_a = db_client.get("/api/v1/tenants/current", headers=_hdrs(two_tenants["a"]["token"]))
        assert ws_a.status_code == 200
        assert ws_a.json()["name"] != "Beta Corp Updated", (
            "Tenant B's workspace update bled into Tenant A's record"
        )


# ---------------------------------------------------------------------------
# 10. Public / webhook endpoint tenant binding
# ---------------------------------------------------------------------------

class TestPublicEndpointTenantBinding:

    def test_webhook_unknown_slug_returns_404(self, db_client):
        """Webhooks addressed to a nonexistent tenant slug must return 404."""
        res = db_client.post(
            "/api/v1/channels/webhook/email/nonexistent-tenant-xyz99",
            json={"from": "x@x.com", "subject": "test", "text": "body"},
        )
        assert res.status_code == 404

    def test_whatsapp_webhook_unknown_slug_returns_404(self, db_client):
        """WhatsApp webhooks addressed to a nonexistent tenant slug must return 404."""
        res = db_client.post(
            "/api/v1/channels/webhook/whatsapp/nonexistent-tenant-xyz99",
            json={"from_phone": "+1000", "message": "hi"},
        )
        assert res.status_code == 404

    def test_webchat_init_unknown_slug_returns_404(self, db_client):
        """Web chat init for an unknown tenant slug must return 404."""
        res = db_client.post(
            "/api/v1/public/chat/init",
            json={"tenant_slug": "nonexistent-xyz99", "visitor_name": "Ghost"},
        )
        assert res.status_code == 404

    def test_form_submission_is_scoped_to_form_tenant(self, db_client):
        """A public form submission creates a ticket in the form's tenant, not a different one."""
        # Create form under Tenant Alpha
        alpha_tok = _register_and_login(
            db_client, "forms.alpha@alpha.io", "Forms Alpha", "Password123!", "admin", "forms-alpha"
        )
        form_res = db_client.post(
            "/api/v1/public/forms",
            json={"slug": "alpha-public-form", "title": "Alpha Form", "is_active": True},
            headers=_hdrs(alpha_tok),
        )
        assert form_res.status_code == 201

        # Anyone submits the form
        sub_res = db_client.post(
            "/api/v1/public/forms/alpha-public-form/submit",
            json={
                "name": "Public Visitor",
                "email": "visitor@public.net",
                "subject": "Form Submit Test",
                "message": "Hello from the form.",
            },
        )
        assert sub_res.status_code == 200
        ticket_id = sub_res.json()["ticket_id"]

        # Verify the ticket is visible to Tenant Alpha (correct owner)
        ticket_check = db_client.get(
            f"/api/v1/tickets/{ticket_id}", headers=_hdrs(alpha_tok)
        )
        assert ticket_check.status_code == 200

        # A different tenant cannot see this ticket
        beta_tok = _register_and_login(
            db_client, "forms.beta@beta.io", "Forms Beta", "Password123!", "admin", "forms-beta"
        )
        cross_check = db_client.get(
            f"/api/v1/tickets/{ticket_id}", headers=_hdrs(beta_tok)
        )
        assert cross_check.status_code == 404, (
            "Ticket created by a public form submission was visible to a different tenant"
        )


# ---------------------------------------------------------------------------
# 11. Workspace permissions & Cross-tenant entity foreign-key binding
# ---------------------------------------------------------------------------

class TestCrossTenantEntityBindingAndPermissions:

    def test_customer_cannot_update_workspace(self, db_client):
        """Customers must receive 403 when attempting to update workspace settings."""
        cust_tok = _register_and_login(
            db_client, "customer.perm@corp.io", "Cust Perm", "Password123!", "customer", "perm-tenant"
        )
        res = db_client.patch(
            "/api/v1/tenants/current",
            json={"name": "Hacked Tenant Name"},
            headers=_hdrs(cust_tok),
        )
        assert res.status_code == 403

    def test_customer_cannot_invite_users(self, db_client):
        """Customers must receive 403 when attempting to invite users to a workspace."""
        cust_tok = _register_and_login(
            db_client, "customer.perm2@corp.io", "Cust Perm 2", "Password123!", "customer", "perm-tenant"
        )
        res = db_client.post(
            "/api/v1/tenants/invite",
            json={"email": "new.agent@corp.io", "role": "agent"},
            headers=_hdrs(cust_tok),
        )
        assert res.status_code == 403

    def test_cannot_bind_contact_to_cross_tenant_org(self, db_client, two_tenants):
        """Tenant A cannot create a contact linked to an organization belonging to Tenant B."""
        # Create Org in Tenant B
        org_b = db_client.post(
            "/api/v1/crm/organizations",
            json={"name": "Beta Private Corp", "domain": "beta.org"},
            headers=_hdrs(two_tenants["b"]["token"]),
        )
        assert org_b.status_code == 201
        org_b_id = org_b.json()["id"]

        # Tenant A tries to create a contact linked to Tenant B's org
        res = db_client.post(
            "/api/v1/crm/contacts",
            json={"name": "Intruder Contact", "organization_id": org_b_id},
            headers=_hdrs(two_tenants["a"]["token"]),
        )
        assert res.status_code == 404

    def test_cannot_assign_ticket_to_cross_tenant_agent(self, db_client, two_tenants):
        """Tenant A cannot assign a ticket to an agent belonging to Tenant B."""
        # Create ticket in Tenant A
        t_res = db_client.post(
            "/api/v1/tickets/",
            json={"subject": "Assignment Isolation Test", "description": "Testing assignee boundary"},
            headers=_hdrs(two_tenants["a"]["token"]),
        )
        assert t_res.status_code == 201
        ticket_id = t_res.json()["id"]

        # Register agent in Tenant B
        beta_agent_tok = _register_and_login(
            db_client, "agent.b@beta-corp.io", "Beta Agent", "Password123!", "agent", "beta-corp"
        )
        agent_b_me = db_client.get("/api/v1/auth/me", headers=_hdrs(beta_agent_tok))
        agent_b_id = agent_b_me.json()["id"]

        # Tenant A tries to assign its ticket to Tenant B's agent
        assign_res = db_client.patch(
            f"/api/v1/tickets/{ticket_id}",
            json={"assigned_to_id": agent_b_id},
            headers=_hdrs(two_tenants["a"]["token"]),
        )
        assert assign_res.status_code == 404

    def test_cannot_bind_routing_rule_to_cross_tenant_team(self, db_client, two_tenants):
        """Tenant A cannot create a routing rule targeting a team belonging to Tenant B."""
        # Create team in Tenant B
        team_b = db_client.post(
            "/api/v1/teams/",
            json={"name": "Beta Security Team", "description": "Private Team"},
            headers=_hdrs(two_tenants["b"]["token"]),
        )
        assert team_b.status_code == 201
        team_b_id = team_b.json()["id"]

        # Tenant A tries to create routing rule targeting Tenant B's team
        res = db_client.post(
            "/api/v1/routing/rules",
            json={"name": "Cross Routing Rule", "strategy": "round_robin", "target_team_id": team_b_id},
            headers=_hdrs(two_tenants["a"]["token"]),
        )
        assert res.status_code == 404

    def test_workspace_settings_persistence(self, db_client, two_tenants):
        """Admin updating workspace name, plan, business_hours, and branding persists properly."""
        patch_res = db_client.patch(
            "/api/v1/tenants/current",
            json={
                "name": "Alpha Corp Enterprise",
                "plan": "Enterprise Omnichannel",
                "business_hours": "09:00 - 18:00 EST",
                "branding_color": "#14213D",
            },
            headers=_hdrs(two_tenants["a"]["token"]),
        )
        assert patch_res.status_code == 200
        data = patch_res.json()
        assert data["name"] == "Alpha Corp Enterprise"
        assert data["plan"] == "Enterprise Omnichannel"
        assert "09:00 - 18:00 EST" in data.get("settings_json", "")
        assert "#14213D" in data.get("settings_json", "")

        # Verify via GET
        get_res = db_client.get("/api/v1/tenants/current", headers=_hdrs(two_tenants["a"]["token"]))
        assert get_res.status_code == 200
        assert "#14213D" in get_res.json().get("settings_json", "")


