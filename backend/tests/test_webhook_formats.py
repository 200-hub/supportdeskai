"""Real provider payload formats, Mailgun replay protection, proxy-aware rate-limit keys."""
import hashlib
import hmac
import json
import time
from types import SimpleNamespace
from unittest.mock import patch

from app.core.config import settings
from app.core.rate_limit import _client_key

SECRET = "mailgun_key_formats"


def _tenant(c, slug):
    c.post("/api/v1/auth/register", json={
        "email": f"owner@{slug}.io", "name": "Owner", "password": "Password123!",
        "role": "admin", "tenant_slug": slug,
    })


def _mg(ts, tok):
    return hmac.new(SECRET.encode(), f"{ts}{tok}".encode(), hashlib.sha256).hexdigest()


def test_mailgun_form_post_accepted_and_replay_rejected(db_client):
    _tenant(db_client, "fmt-mail")
    ts, tok = str(int(time.time())), "form-token-1"
    form = {
        "timestamp": ts, "token": tok, "signature": _mg(ts, tok),
        "sender": "jane@example.com", "From": "Jane Doe <jane@example.com>",
        "subject": "Invoice question", "body-plain": "Where is my invoice?",
    }
    with patch.object(settings, "EMAIL_WEBHOOK_SECRET", SECRET), \
         patch.object(settings, "ENVIRONMENT", "production"):
        first = db_client.post("/api/v1/channels/webhook/email/fmt-mail", data=form)
        replay = db_client.post("/api/v1/channels/webhook/email/fmt-mail", data=form)
    assert first.status_code == 200, first.text
    assert replay.status_code == 401

    tid = first.json()["ticket_id"]
    agent = db_client.post("/api/v1/auth/login", json={
        "email": "owner@fmt-mail.io", "password": "Password123!", "tenant_slug": "fmt-mail"})
    h = {"Authorization": f"Bearer {agent.json()['access_token']}"}
    t = db_client.get(f"/api/v1/tickets/{tid}", headers=h).json()
    assert t["subject"] == "Invoice question"
    assert t["messages"][0]["content"] == "Where is my invoice?"
    assert t["messages"][0]["sender_name"] == "Jane Doe"


def test_mailgun_stale_timestamp_rejected(db_client):
    _tenant(db_client, "fmt-mail")
    ts, tok = str(int(time.time()) - 3600), "old-token"
    body = {"timestamp": ts, "token": tok, "signature": _mg(ts, tok), "from": "a@b.com", "text": "hi"}
    with patch.object(settings, "EMAIL_WEBHOOK_SECRET", SECRET), \
         patch.object(settings, "ENVIRONMENT", "production"):
        res = db_client.post("/api/v1/channels/webhook/email/fmt-mail", json=body)
    assert res.status_code == 401


def test_meta_whatsapp_payload_and_status_receipts(db_client):
    _tenant(db_client, "fmt-wa")
    meta = {"object": "whatsapp_business_account", "entry": [{"changes": [{"value": {
        "contacts": [{"profile": {"name": "Ravi"}, "wa_id": "919800000000"}],
        "messages": [{"from": "919800000000", "id": "wamid.1", "type": "text",
                      "text": {"body": "My order hasn't arrived"}}],
    }}]}]}
    res = db_client.post("/api/v1/channels/webhook/whatsapp/fmt-wa", content=json.dumps(meta),
                         headers={"Content-Type": "application/json"})
    assert res.status_code == 200 and res.json()["status"] == "processed"
    assert len(res.json()["ticket_ids"]) == 1

    receipt = {"entry": [{"changes": [{"value": {"statuses": [{"id": "wamid.1", "status": "read"}]}}]}]}
    res = db_client.post("/api/v1/channels/webhook/whatsapp/fmt-wa", json=receipt)
    assert res.status_code == 200 and res.json()["status"] == "ignored"


def test_rate_limit_key_uses_proxy_appended_ip():
    req = SimpleNamespace(headers={"X-Forwarded-For": "6.6.6.6, 203.0.113.7"},
                          client=SimpleNamespace(host="10.0.0.1"))
    with patch.object(settings, "TRUST_PROXY_HEADERS", True):
        assert _client_key(req) == "203.0.113.7"  # spoofed left entry ignored
    assert _client_key(req) == "10.0.0.1"  # proxy headers ignored unless trusted
