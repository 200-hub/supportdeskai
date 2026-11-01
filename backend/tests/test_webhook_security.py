"""
Webhook Security & Rate Limiting Tests
=======================================
Tests for:
  1. WhatsApp HMAC-SHA256 signature verification
  2. WhatsApp hub challenge (GET handshake)
  3. Email / Mailgun HMAC-SHA256 signature verification
  4. Production fail-safe when secrets are absent
  5. Malformed payload rejection
  6. Rate limiting (HTTP 429) and recovery

All tests are fully isolated and deterministic.
They use patch.object on the real settings singleton so the same object
that the application code reads is patched — no stale reference issues.
"""

import hashlib
import hmac as hmac_module
import json
import time
from unittest.mock import patch

import pytest

# Real settings singleton — patch.object modifies attributes on this instance
from app.core.config import settings as real_settings
from app.core.rate_limit import _BUCKETS, _LOCK


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _wa_sig(secret: str, body: bytes) -> str:
    """Compute a valid WhatsApp X-Hub-Signature-256 value."""
    digest = hmac_module.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


def _mg_triple(secret: str, timestamp: str, token: str) -> str:
    """Compute a valid Mailgun HMAC-SHA256 signature."""
    data = f"{timestamp}{token}".encode()
    return hmac_module.new(secret.encode(), data, hashlib.sha256).hexdigest()


def _wa_payload() -> dict:
    return {"from_phone": "+15550001234", "message": "Hello from WhatsApp"}


def _reset_bucket(limiter_name: str):
    """Reset the in-process token bucket for a given limiter name."""
    with _LOCK:
        _BUCKETS[limiter_name].clear()


# ---------------------------------------------------------------------------
# Tenant setup helper
# ---------------------------------------------------------------------------

def _ensure_tenant(db_client, slug: str, email: str, name: str = "Agent"):
    """Register a tenant admin. Always resets the register bucket first so
    rate-limit tests run earlier in the session cannot block setup calls."""
    _reset_bucket("auth_register")
    db_client.post(
        "/api/v1/auth/register",
        json={
            "email": email, "name": name, "password": "Password123!",
            "role": "admin", "tenant_slug": slug,
        },
    )


# ---------------------------------------------------------------------------
# 1. WhatsApp signature verification
# ---------------------------------------------------------------------------

class TestWhatsAppSignature:

    def test_valid_signature_accepted(self, db_client):
        """Valid HMAC-SHA256 signature from Meta is accepted."""
        _ensure_tenant(db_client, "wa-sig-tenant", "wa.sig@test.io")
        secret = "wa_sig_secret_abc"
        body = json.dumps(_wa_payload()).encode()
        sig = _wa_sig(secret, body)

        with patch.object(real_settings, "WHATSAPP_WEBHOOK_SECRET", secret), \
             patch.object(real_settings, "ENVIRONMENT", "production"):
            res = db_client.post(
                "/api/v1/channels/webhook/whatsapp/wa-sig-tenant",
                content=body,
                headers={"Content-Type": "application/json", "X-Hub-Signature-256": sig},
            )
        assert res.status_code == 200, res.text
        assert res.json()["status"] == "processed"

    def test_invalid_signature_rejected(self, db_client):
        """Wrong signature returns 401."""
        _ensure_tenant(db_client, "wa-sig-tenant", "wa.sig@test.io")
        secret = "wa_sig_secret_abc"
        body = json.dumps(_wa_payload()).encode()

        with patch.object(real_settings, "WHATSAPP_WEBHOOK_SECRET", secret), \
             patch.object(real_settings, "ENVIRONMENT", "production"):
            res = db_client.post(
                "/api/v1/channels/webhook/whatsapp/wa-sig-tenant",
                content=body,
                headers={"Content-Type": "application/json", "X-Hub-Signature-256": "sha256=deadbeef"},
            )
        assert res.status_code == 401, res.text

    def test_missing_signature_header_rejected(self, db_client):
        """Missing X-Hub-Signature-256 header returns 401."""
        _ensure_tenant(db_client, "wa-sig-tenant", "wa.sig@test.io")
        secret = "wa_sig_secret_abc"
        body = json.dumps(_wa_payload()).encode()

        with patch.object(real_settings, "WHATSAPP_WEBHOOK_SECRET", secret), \
             patch.object(real_settings, "ENVIRONMENT", "production"):
            res = db_client.post(
                "/api/v1/channels/webhook/whatsapp/wa-sig-tenant",
                content=body,
                headers={"Content-Type": "application/json"},
            )
        assert res.status_code == 401, res.text

    def test_malformed_json_payload_rejected(self, db_client):
        """Non-JSON body returns 400 even with a valid HMAC signature."""
        _ensure_tenant(db_client, "wa-sig-tenant", "wa.sig@test.io")
        secret = "wa_sig_secret_abc"
        body = b"not valid json {"
        sig = _wa_sig(secret, body)

        with patch.object(real_settings, "WHATSAPP_WEBHOOK_SECRET", secret), \
             patch.object(real_settings, "ENVIRONMENT", "production"):
            res = db_client.post(
                "/api/v1/channels/webhook/whatsapp/wa-sig-tenant",
                content=body,
                headers={"Content-Type": "application/json", "X-Hub-Signature-256": sig},
            )
        assert res.status_code == 400, res.text

    def test_missing_secret_in_production_returns_503(self, db_client):
        """In production, a missing WHATSAPP_WEBHOOK_SECRET causes 503."""
        with patch.object(real_settings, "WHATSAPP_WEBHOOK_SECRET", None), \
             patch.object(real_settings, "ENVIRONMENT", "production"):
            res = db_client.post(
                "/api/v1/channels/webhook/whatsapp/wa-sig-tenant",
                json=_wa_payload(),
            )
        assert res.status_code == 503, res.text

    def test_missing_secret_in_dev_skips_verification(self, db_client):
        """In development mode, missing secret skips verification."""
        _ensure_tenant(db_client, "wa-sig-tenant", "wa.sig@test.io")
        body = json.dumps(_wa_payload()).encode()

        with patch.object(real_settings, "WHATSAPP_WEBHOOK_SECRET", None), \
             patch.object(real_settings, "ENVIRONMENT", "development"):
            res = db_client.post(
                "/api/v1/channels/webhook/whatsapp/wa-sig-tenant",
                content=body,
                headers={"Content-Type": "application/json"},
            )
        assert res.status_code == 200, res.text

    def test_tampered_body_rejected(self, db_client):
        """Signature computed over original body is rejected for a tampered body."""
        _ensure_tenant(db_client, "wa-sig-tenant", "wa.sig@test.io")
        secret = "wa_sig_secret_abc"
        original = json.dumps({"from_phone": "+1", "message": "Original"}).encode()
        tampered = json.dumps({"from_phone": "+1", "message": "Tampered"}).encode()
        sig = _wa_sig(secret, original)

        with patch.object(real_settings, "WHATSAPP_WEBHOOK_SECRET", secret), \
             patch.object(real_settings, "ENVIRONMENT", "production"):
            res = db_client.post(
                "/api/v1/channels/webhook/whatsapp/wa-sig-tenant",
                content=tampered,
                headers={"Content-Type": "application/json", "X-Hub-Signature-256": sig},
            )
        assert res.status_code == 401, res.text


# ---------------------------------------------------------------------------
# 2. WhatsApp hub challenge (GET handshake)
# ---------------------------------------------------------------------------

class TestWhatsAppHubChallenge:

    def test_valid_hub_challenge_returns_challenge_string(self, db_client):
        """Correct hub.verify_token echoes back hub.challenge as plain text."""
        secret = "hub_verify_token_xyz"

        with patch.object(real_settings, "WHATSAPP_WEBHOOK_SECRET", secret):
            res = db_client.get(
                "/api/v1/channels/webhook/whatsapp/wa-sig-tenant",
                params={
                    "hub.mode": "subscribe",
                    "hub.challenge": "CHALLENGE_ECHO_12345",
                    "hub.verify_token": secret,
                },
            )
        assert res.status_code == 200, res.text
        assert res.text == "CHALLENGE_ECHO_12345"

    def test_wrong_verify_token_returns_403(self, db_client):
        """Wrong hub.verify_token returns 403."""
        with patch.object(real_settings, "WHATSAPP_WEBHOOK_SECRET", "correct_token"):
            res = db_client.get(
                "/api/v1/channels/webhook/whatsapp/wa-sig-tenant",
                params={
                    "hub.mode": "subscribe",
                    "hub.challenge": "CHALLENGE",
                    "hub.verify_token": "wrong_token",
                },
            )
        assert res.status_code == 403, res.text

    def test_wrong_hub_mode_returns_403(self, db_client):
        """hub.mode other than 'subscribe' returns 403."""
        with patch.object(real_settings, "WHATSAPP_WEBHOOK_SECRET", "correct_token"):
            res = db_client.get(
                "/api/v1/channels/webhook/whatsapp/wa-sig-tenant",
                params={
                    "hub.mode": "unsubscribe",
                    "hub.challenge": "CHALLENGE",
                    "hub.verify_token": "correct_token",
                },
            )
        assert res.status_code == 403, res.text

    def test_missing_secret_in_production_returns_503(self, db_client):
        """Missing verify token config returns 503."""
        with patch.object(real_settings, "WHATSAPP_WEBHOOK_SECRET", None):
            res = db_client.get(
                "/api/v1/channels/webhook/whatsapp/wa-sig-tenant",
                params={"hub.mode": "subscribe", "hub.challenge": "C", "hub.verify_token": "x"},
            )
        assert res.status_code == 503, res.text


# ---------------------------------------------------------------------------
# 3. Email / Mailgun signature verification
# ---------------------------------------------------------------------------

class TestEmailSignature:

    def test_valid_mailgun_signature_accepted(self, db_client):
        """Valid Mailgun timestamp/token/signature triple is accepted."""
        _ensure_tenant(db_client, "email-sig-tenant", "email.sig@test.io")
        secret = "mailgun_signing_key_abc"
        ts = str(int(time.time()))
        tok = "uniquetoken123"
        sig = _mg_triple(secret, ts, tok)
        payload = {
            "from": "cust@example.com", "from_name": "Test Customer",
            "subject": "Help needed", "text": "My order is broken.",
            "timestamp": ts, "token": tok, "signature": sig,
        }
        body = json.dumps(payload).encode()

        with patch.object(real_settings, "EMAIL_WEBHOOK_SECRET", secret), \
             patch.object(real_settings, "ENVIRONMENT", "production"):
            res = db_client.post(
                "/api/v1/channels/webhook/email/email-sig-tenant",
                content=body,
                headers={"Content-Type": "application/json"},
            )
        assert res.status_code == 200, res.text
        assert res.json()["status"] == "processed"

    def test_invalid_mailgun_signature_rejected(self, db_client):
        """Wrong Mailgun signature returns 401."""
        _ensure_tenant(db_client, "email-sig-tenant", "email.sig@test.io")
        secret = "mailgun_signing_key_abc"
        ts = str(int(time.time()))
        tok = "uniquetoken123"
        payload = {
            "from": "cust@example.com", "subject": "Test", "text": "Body",
            "timestamp": ts, "token": tok, "signature": "wrongsig",
        }
        body = json.dumps(payload).encode()

        with patch.object(real_settings, "EMAIL_WEBHOOK_SECRET", secret), \
             patch.object(real_settings, "ENVIRONMENT", "production"):
            res = db_client.post(
                "/api/v1/channels/webhook/email/email-sig-tenant",
                content=body,
                headers={"Content-Type": "application/json"},
            )
        assert res.status_code == 401, res.text

    def test_generic_hmac_header_accepted(self, db_client):
        """Generic X-Webhook-Signature HMAC header is accepted."""
        _ensure_tenant(db_client, "email-sig-tenant", "email.sig@test.io")
        secret = "shared_hmac_secret_abc"
        payload = {"from": "cust@example.com", "from_name": "Cust", "subject": "Hi", "text": "Need help"}
        body = json.dumps(payload).encode()
        header_sig = hmac_module.new(secret.encode(), body, hashlib.sha256).hexdigest()

        with patch.object(real_settings, "EMAIL_WEBHOOK_SECRET", secret), \
             patch.object(real_settings, "ENVIRONMENT", "production"):
            res = db_client.post(
                "/api/v1/channels/webhook/email/email-sig-tenant",
                content=body,
                headers={"Content-Type": "application/json", "X-Webhook-Signature": header_sig},
            )
        assert res.status_code == 200, res.text

    def test_missing_signature_rejected(self, db_client):
        """No signature at all returns 401."""
        _ensure_tenant(db_client, "email-sig-tenant", "email.sig@test.io")
        secret = "shared_hmac_secret_abc"
        payload = {"from": "cust@example.com", "subject": "Hi", "text": "Need help"}
        body = json.dumps(payload).encode()

        with patch.object(real_settings, "EMAIL_WEBHOOK_SECRET", secret), \
             patch.object(real_settings, "ENVIRONMENT", "production"):
            res = db_client.post(
                "/api/v1/channels/webhook/email/email-sig-tenant",
                content=body,
                headers={"Content-Type": "application/json"},
            )
        assert res.status_code == 401, res.text

    def test_malformed_json_payload_rejected(self, db_client):
        """Non-JSON body returns 400 even with valid HMAC signature."""
        _ensure_tenant(db_client, "email-sig-tenant", "email.sig@test.io")
        secret = "shared_hmac_secret_abc"
        body = b"not-json-content"
        header_sig = hmac_module.new(secret.encode(), body, hashlib.sha256).hexdigest()

        with patch.object(real_settings, "EMAIL_WEBHOOK_SECRET", secret), \
             patch.object(real_settings, "ENVIRONMENT", "production"):
            res = db_client.post(
                "/api/v1/channels/webhook/email/email-sig-tenant",
                content=body,
                headers={"Content-Type": "application/json", "X-Webhook-Signature": header_sig},
            )
        assert res.status_code == 400, res.text

    def test_missing_secret_in_production_returns_503(self, db_client):
        """Missing EMAIL_WEBHOOK_SECRET in production returns 503."""
        with patch.object(real_settings, "EMAIL_WEBHOOK_SECRET", None), \
             patch.object(real_settings, "ENVIRONMENT", "production"):
            res = db_client.post(
                "/api/v1/channels/webhook/email/email-sig-tenant",
                json={"from": "x@x.com", "subject": "test", "text": "body"},
            )
        assert res.status_code == 503, res.text

    def test_missing_secret_in_dev_skips_verification(self, db_client):
        """Missing secret in development mode skips signature verification."""
        _ensure_tenant(db_client, "email-sig-tenant", "email.sig@test.io")
        body = json.dumps({
            "from": "cust@example.com", "from_name": "Cust",
            "subject": "Hi", "text": "Need help",
        }).encode()

        with patch.object(real_settings, "EMAIL_WEBHOOK_SECRET", None), \
             patch.object(real_settings, "ENVIRONMENT", "development"):
            res = db_client.post(
                "/api/v1/channels/webhook/email/email-sig-tenant",
                content=body,
                headers={"Content-Type": "application/json"},
            )
        assert res.status_code == 200, res.text


# ---------------------------------------------------------------------------
# 4. Rate limiting
# ---------------------------------------------------------------------------

class TestRateLimiting:
    """
    Rate limit tests.  The limiter uses in-process token-bucket state.
    Each test resets the relevant bucket to guarantee a clean baseline.

    Note: The TestClient uses 'testclient' as the client host IP, so all
    test requests share the same rate-limit key.  Resetting the bucket
    before each test prevents cross-test contamination.
    """

    # --- Form submission ---

    def test_form_submit_rate_limit_429_after_threshold(self, db_client):
        """Submitting a form >10 times per 60s returns 429 on the 11th request."""
        _reset_bucket("public_form_submit")
        _ensure_tenant(db_client, "rl-form-tenant", "rl.form@test.io")

        db_client.post(
            "/api/v1/public/forms",
            json={"slug": "rl-test-form", "title": "RL Test", "is_active": True},
            headers={"Authorization": f"Bearer {_get_token(db_client, 'rl.form@test.io', 'rl-form-tenant')}"},
        )

        submission = {
            "name": "Visitor", "email": "v@v.com",
            "subject": "Test", "message": "Rate limit test message",
        }

        # First 10 should not be 429
        for i in range(10):
            res = db_client.post("/api/v1/public/forms/rl-test-form/submit", json=submission)
            assert res.status_code != 429, f"Got 429 too early on request {i + 1}: {res.text}"

        # 11th must be 429
        res = db_client.post("/api/v1/public/forms/rl-test-form/submit", json=submission)
        assert res.status_code == 429, f"Expected 429 on 11th request, got {res.status_code}"
        assert "Retry-After" in res.headers, "429 response missing Retry-After header"

    def test_form_submit_legitimate_requests_work(self, db_client):
        """Within the rate limit, form submissions succeed."""
        _reset_bucket("public_form_submit")
        res = db_client.post(
            "/api/v1/public/forms/rl-test-form/submit",
            json={"name": "OK", "email": "ok@ok.com", "subject": "OK", "message": "Valid request"},
        )
        assert res.status_code != 429

    # --- Login ---

    def test_login_rate_limit_429_after_threshold(self, db_client):
        """Logging in >10 times per 60s returns 429 on the 11th request."""
        _reset_bucket("auth_login")

        for i in range(10):
            res = db_client.post(
                "/api/v1/auth/login",
                json={"email": "bogus@rl.io", "password": "WrongPass1!", "tenant_slug": "nonexistent"},
            )
            assert res.status_code != 429, f"429 too early on attempt {i + 1}"

        res = db_client.post(
            "/api/v1/auth/login",
            json={"email": "bogus@rl.io", "password": "WrongPass1!", "tenant_slug": "nonexistent"},
        )
        assert res.status_code == 429, f"Expected 429 on 11th login, got {res.status_code}"
        assert "Retry-After" in res.headers

    # --- Password reset ---

    def test_password_reset_rate_limit_429_after_threshold(self, db_client):
        """Password reset >5 times per 300s returns 429 on the 6th request."""
        _reset_bucket("auth_pw_reset")

        for i in range(5):
            res = db_client.post(
                "/api/v1/auth/password-reset/request",
                json={"email": "bogus@pwreset.io", "tenant_slug": "nonexistent"},
            )
            assert res.status_code != 429, f"429 too early on attempt {i + 1}"

        res = db_client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "bogus@pwreset.io", "tenant_slug": "nonexistent"},
        )
        assert res.status_code == 429, f"Expected 429 on 6th password reset, got {res.status_code}"

    # --- Webchat init ---

    def test_webchat_init_rate_limit_429_after_threshold(self, db_client):
        """Webchat init >20 times per 60s returns 429."""
        _reset_bucket("public_webchat_init")
        _ensure_tenant(db_client, "wc-rl-tenant", "wc.rl@test.io")

        for i in range(20):
            res = db_client.post(
                "/api/v1/public/chat/init",
                json={"tenant_slug": "wc-rl-tenant", "visitor_name": f"Visitor{i}"},
            )
            assert res.status_code != 429, f"429 too early on init {i + 1}"

        res = db_client.post(
            "/api/v1/public/chat/init",
            json={"tenant_slug": "wc-rl-tenant", "visitor_name": "Visitor21"},
        )
        assert res.status_code == 429

    # --- Register ---

    def test_register_rate_limit_429_after_threshold(self, db_client):
        """Registration >5 times per 60s returns 429."""
        _reset_bucket("auth_register")

        for i in range(5):
            res = db_client.post(
                "/api/v1/auth/register",
                json={
                    "email": f"rlreg{i}@rl.io", "name": f"RL {i}",
                    "password": "Password123!", "role": "customer", "tenant_slug": "rl-reg-tenant",
                },
            )
            assert res.status_code != 429, f"429 too early on registration {i + 1}"

        res = db_client.post(
            "/api/v1/auth/register",
            json={
                "email": "rlreg99@rl.io", "name": "RL 99",
                "password": "Password123!", "role": "customer", "tenant_slug": "rl-reg-tenant",
            },
        )
        assert res.status_code == 429, f"Expected 429 on 6th registration, got {res.status_code}"

    # --- Retry-After header ---

    def test_rate_limit_response_has_retry_after_header(self, db_client):
        """HTTP 429 responses must include a Retry-After header."""
        _reset_bucket("auth_register")
        for i in range(5):
            db_client.post(
                "/api/v1/auth/register",
                json={
                    "email": f"rh{i}@rh.io", "name": f"RH {i}",
                    "password": "Password123!", "role": "customer", "tenant_slug": "rh-tenant",
                },
            )
        res = db_client.post(
            "/api/v1/auth/register",
            json={
                "email": "rh99@rh.io", "name": "RH 99",
                "password": "Password123!", "role": "customer", "tenant_slug": "rh-tenant",
            },
        )
        assert res.status_code == 429
        assert "Retry-After" in res.headers, f"Missing Retry-After. Headers: {dict(res.headers)}"
        assert int(res.headers["Retry-After"]) > 0


# ---------------------------------------------------------------------------
# Helper used inside test class
# ---------------------------------------------------------------------------

def _get_token(db_client, email: str, tenant_slug: str) -> str:
    """Login and return access token."""
    res = db_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!", "tenant_slug": tenant_slug},
    )
    return res.json().get("access_token", "")
