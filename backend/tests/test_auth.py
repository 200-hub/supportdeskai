def test_register_customer_success(db_client):
    payload = {
        "email": "sarah.connor@cyberdyne.org",
        "name": "Sarah Connor",
        "password": "Password123!",
        "role": "customer",
        "phone": "+1 555-234-5678",
        "company": "Cyberdyne Systems",
        "tenant_slug": "cyberdyne",
    }
    response = db_client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "sarah.connor@cyberdyne.org"
    assert data["user"]["name"] == "Sarah Connor"
    assert data["user"]["role"] == "customer"
    assert data["user"]["avatar_initials"] == "SC"


def test_register_duplicate_email_fails(db_client):
    payload = {
        "email": "sarah.connor@cyberdyne.org",
        "name": "Sarah Clone",
        "password": "Password456!",
        "role": "customer",
        "tenant_slug": "cyberdyne",
    }
    response = db_client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_login_success(db_client):
    payload = {
        "email": "sarah.connor@cyberdyne.org",
        "password": "Password123!",
        "tenant_slug": "cyberdyne",
    }
    response = db_client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "sarah.connor@cyberdyne.org"


def test_login_invalid_password(db_client):
    payload = {
        "email": "sarah.connor@cyberdyne.org",
        "password": "WrongPassword999!",
        "tenant_slug": "cyberdyne",
    }
    response = db_client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_get_current_user_profile(db_client):
    # Login to get valid token
    login_resp = db_client.post(
        "/api/v1/auth/login",
        json={"email": "sarah.connor@cyberdyne.org", "password": "Password123!", "tenant_slug": "cyberdyne"},
    )
    token = login_resp.json()["access_token"]

    # Call /auth/me with Bearer token
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = db_client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    user_data = me_resp.json()
    assert user_data["email"] == "sarah.connor@cyberdyne.org"
    assert user_data["name"] == "Sarah Connor"


def test_get_profile_unauthorized_without_token(db_client):
    response = db_client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_register_and_login_agent(db_client):
    payload = {
        "email": "sayoni.support@cyberdyne.org",
        "name": "Sayoni Bhattacharjee",
        "password": "AgentSecurePassword123!",
        "role": "agent",
        "tenant_slug": "cyberdyne",
    }
    reg_resp = db_client.post("/api/v1/auth/register", json=payload)
    assert reg_resp.status_code == 201
    assert reg_resp.json()["user"]["role"] == "agent"

    login_resp = db_client.post(
        "/api/v1/auth/login",
        json={"email": "sayoni.support@cyberdyne.org", "password": "AgentSecurePassword123!", "role": "agent"},
    )
    assert login_resp.status_code == 200
    assert login_resp.json()["user"]["role"] == "agent"



def test_refresh_token_rotation(db_client):
    reg_resp = db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "token.rotation@test.org",
            "name": "Rotation User",
            "password": "Password123!",
            "role": "customer",
            "tenant_slug": "cyberdyne",
        },
    )
    assert reg_resp.status_code == 201
    refresh_tok = reg_resp.json()["refresh_token"]
    assert refresh_tok is not None

    # Rotate refresh token
    rotate_resp = db_client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_tok})
    assert rotate_resp.status_code == 200
    new_data = rotate_resp.json()
    assert "access_token" in new_data
    assert "refresh_token" in new_data
    assert new_data["refresh_token"] != refresh_tok

    # Old refresh token should now be revoked (fail with 401)
    fail_resp = db_client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_tok})
    assert fail_resp.status_code == 401

    # Token reuse detection: presenting the revoked token should have invalidated the new token as well
    reused_fail = db_client.post("/api/v1/auth/refresh", json={"refresh_token": new_data["refresh_token"]})
    assert reused_fail.status_code == 401


def test_password_reset_flow(db_client):
    # Request reset token
    req_res = db_client.post(
        "/api/v1/auth/password-reset/request",
        json={"email": "sarah.connor@cyberdyne.org", "tenant_slug": "cyberdyne"},
    )
    assert req_res.status_code == 200
    reset_tok = req_res.json()["reset_token"]

    # Confirm password reset
    confirm_res = db_client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"token": reset_tok, "new_password": "NewSecretPassword99!"},
    )
    assert confirm_res.status_code == 200

    # Single-use enforcement: re-using the same reset token must fail
    reuse_res = db_client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"token": reset_tok, "new_password": "AnotherPassword123!"},
    )
    assert reuse_res.status_code == 400
    assert "already been used or is invalid" in reuse_res.json()["detail"]

    # Old password should now fail
    old_login = db_client.post(
        "/api/v1/auth/login",
        json={"email": "sarah.connor@cyberdyne.org", "password": "Password123!", "tenant_slug": "cyberdyne"},
    )
    assert old_login.status_code == 401

    # New password should succeed
    new_login = db_client.post(
        "/api/v1/auth/login",
        json={"email": "sarah.connor@cyberdyne.org", "password": "NewSecretPassword99!", "tenant_slug": "cyberdyne"},
    )
    assert new_login.status_code == 200


def test_logout_session_revocation(db_client):
    # Register and login a fresh session
    reg_resp = db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "logout.test@cyberdyne.org",
            "name": "Logout Tester",
            "password": "Password123!",
            "role": "customer",
            "tenant_slug": "cyberdyne",
        },
    )
    assert reg_resp.status_code == 201
    access_tok = reg_resp.json()["access_token"]
    refresh_tok = reg_resp.json()["refresh_token"]

    # Logout with bearer token
    logout_resp = db_client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access_tok}"},
    )
    assert logout_resp.status_code == 200

    # Refresh token should now be revoked
    refresh_fail = db_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_tok},
    )
    assert refresh_fail.status_code == 401


def test_role_and_tenant_isolation_security(db_client):
    # Register customer in cyberdyne tenant
    cust_res = db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "restricted.customer@cyberdyne.org",
            "name": "Restricted Customer",
            "password": "Password123!",
            "role": "customer",
            "tenant_slug": "cyberdyne",
        },
    )
    cust_token = cust_res.json()["access_token"]

    # Customer tries to create a ticket with an internal note (restricted to agents/admins)
    ticket_res = db_client.post(
        "/api/v1/tickets/",
        json={"subject": "Customer Ticket", "description": "Need assistance"},
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    ticket_id = ticket_res.json()["id"]

    # Attempt to post internal note as customer
    internal_msg_res = db_client.post(
        f"/api/v1/tickets/{ticket_id}/messages",
        json={"content": "Customer trying to write internal note", "sender_type": "internal_note"},
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert internal_msg_res.status_code == 403

    # Register user in a completely different tenant
    other_tenant_res = db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "intruder@weyland-yutani.corp",
            "name": "Weyland Intruder",
            "password": "Password123!",
            "role": "customer",
            "tenant_slug": "weyland-yutani",
        },
    )
    other_token = other_tenant_res.json()["access_token"]

    # Intruder from Weyland tries to access Cyberdyne's ticket
    cross_tenant_res = db_client.get(
        f"/api/v1/tickets/{ticket_id}",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert cross_tenant_res.status_code == 404


def test_login_nonexistent_user_returns_generic_error(db_client):
    """
    Login with nonexistent user must return identical 401 message to prevent user enumeration.
    """
    response = db_client.post(
        "/api/v1/auth/login",
        json={"email": "nobody.nonexistent@cyberdyne.org", "password": "AnyPassword123!", "tenant_slug": "cyberdyne"},
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_token_missing_tenant_id_rejected(db_client):
    """
    Access token missing the mandatory tenant_id claim must be rejected with 401.
    """
    from app.core.security import create_access_token

    # Token with sub but NO tenant_id
    token = create_access_token(subject="some-user-id", claims={"email": "orphan@test.io"})
    response = db_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert "missing tenant identifier" in response.json()["detail"]


def test_token_mismatched_tenant_id_rejected(db_client):
    """
    Access token with a tenant_id that does not match the user's actual tenant is rejected with 401.
    """
    from app.core.security import create_access_token

    # Register legitimate user
    reg = db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "tenant.mismatch@cyberdyne.org",
            "name": "Mismatch User",
            "password": "Password123!",
            "role": "customer",
            "tenant_slug": "cyberdyne",
        },
    )
    user_id = reg.json()["user"]["id"]

    # Forge token pointing to a different tenant_id
    fake_token = create_access_token(
        subject=user_id,
        claims={"tenant_id": "different-tenant-id-9999", "email": "tenant.mismatch@cyberdyne.org"},
    )
    response = db_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {fake_token}"})
    assert response.status_code == 401


def test_password_reset_token_rejected_as_access_token(db_client):
    """
    Tokens minted with purpose='password_reset' must not be accepted as access tokens on API routes.
    """
    from app.core.security import create_access_token

    reg = db_client.post(
        "/api/v1/auth/register",
        json={
            "email": "reset.purpose@cyberdyne.org",
            "name": "Purpose User",
            "password": "Password123!",
            "role": "customer",
            "tenant_slug": "cyberdyne",
        },
    )
    user_id = reg.json()["user"]["id"]
    tenant_id = reg.json()["user"]["tenant_id"]

    # Create password reset token
    reset_token = create_access_token(
        subject=user_id,
        claims={"purpose": "password_reset", "tenant_id": tenant_id, "email": "reset.purpose@cyberdyne.org"},
    )

    # Attempt to use as Bearer token on /api/v1/auth/me
    response = db_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {reset_token}"})
    assert response.status_code == 401
    assert "Invalid token purpose" in response.json()["detail"]


def test_password_reset_unknown_user_anti_enumeration(db_client):
    """
    Requesting password reset for an unknown user returns the generic success message without leaking.
    """
    response = db_client.post(
        "/api/v1/auth/password-reset/request",
        json={"email": "nobody@cyberdyne.org", "tenant_slug": "cyberdyne"},
    )
    assert response.status_code == 200
    assert "instructions have been dispatched" in response.json()["message"]


def test_password_reset_unknown_workspace_anti_enumeration(db_client):
    """
    Requesting password reset for an unknown tenant returns the generic success message.
    """
    response = db_client.post(
        "/api/v1/auth/password-reset/request",
        json={"email": "sarah.connor@cyberdyne.org", "tenant_slug": "nonexistent-workspace"},
    )
    assert response.status_code == 200
    assert "instructions have been dispatched" in response.json()["message"]


def test_production_secret_key_validation():
    """
    In production mode, settings validation must reject the default insecure secret key.
    """
    import os
    from unittest.mock import patch
    from pydantic import ValidationError
    from app.core.config import Settings

    with patch.dict(os.environ, {"ENVIRONMENT": "production", "SECRET_KEY": "insecure_dev_secret_key_change_in_production"}):
        import pytest
        with pytest.raises(ValidationError) as exc_info:
            Settings()
        assert "SECRET_KEY" in str(exc_info.value)

