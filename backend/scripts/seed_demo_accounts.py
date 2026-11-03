"""
Create the demo admin / agent / customer accounts in the `default-tenant`
workspace (the one the mobile app signs into). Safe to run more than once.

Usage (backend must be running):
    python scripts/seed_demo_accounts.py [API_BASE_URL]
    # default API_BASE_URL: http://localhost:8000
"""
import sys

import httpx

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000").rstrip("/") + "/api/v1"
TENANT = "default-tenant"
PASSWORD = "Password123!"
ADMIN, AGENT, CUSTOMER = "admin@demo.com", "agent@demo.com", "customer@demo.com"


def login(c: httpx.Client, email: str) -> str | None:
    r = c.post(f"{BASE}/auth/login", json={"email": email, "password": PASSWORD, "tenant_slug": TENANT})
    return r.json()["access_token"] if r.status_code == 200 else None


def main() -> None:
    with httpx.Client(timeout=30) as c:
        # Admin: only the first user of a new workspace may self-register as admin.
        if not login(c, ADMIN):
            r = c.post(f"{BASE}/auth/register", json={
                "email": ADMIN, "name": "Demo Admin", "password": PASSWORD,
                "role": "admin", "tenant_slug": TENANT,
            })
            if r.status_code != 201:
                sys.exit(f"Could not create admin ({r.status_code}): {r.text}\n"
                         f"If '{TENANT}' already has users, create {ADMIN} via an existing admin's invite.")
        admin_token = login(c, ADMIN)
        print(f"admin     {ADMIN}")

        # Agent: staff accounts in an existing workspace come from an admin invitation.
        if not login(c, AGENT):
            r = c.post(f"{BASE}/tenants/invite", json={"email": AGENT, "role": "agent"},
                       headers={"Authorization": f"Bearer {admin_token}"})
            r.raise_for_status()
            token = r.json()[0]["invitation_token"]
            c.post(f"{BASE}/tenants/invitations/{token}/accept",
                   json={"name": "Demo Agent", "password": PASSWORD}).raise_for_status()
        print(f"agent     {AGENT}")

        # Customer: normal self sign-up.
        if not login(c, CUSTOMER):
            c.post(f"{BASE}/auth/register", json={
                "email": CUSTOMER, "name": "Demo Customer", "password": PASSWORD, "tenant_slug": TENANT,
            }).raise_for_status()
        print(f"customer  {CUSTOMER}")
        print(f"password  {PASSWORD}  (all accounts, workspace '{TENANT}')")


if __name__ == "__main__":
    main()
