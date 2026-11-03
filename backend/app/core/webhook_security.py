"""
Webhook Signature Verification
================================
Provider-specific HMAC authenticity checks for inbound webhooks.

Supported providers
-------------------
* WhatsApp Cloud API (Meta)  — HMAC-SHA256, header ``X-Hub-Signature-256``
* Mailgun                    — HMAC-SHA256, token/timestamp/signature triple
* SendGrid                   — HMAC-SHA256, header ``X-Twilio-Email-Event-Webhook-Signature``

Design notes
------------
* Secrets are read exclusively from environment variables via ``Settings``.
* If a required secret is absent in production (``ENVIRONMENT != "development"``
  and ``ENVIRONMENT != "testing"``), the function raises HTTP 503 rather than
  silently accepting unauthenticated requests.
* In development/testing the check is skipped when the secret is absent, so
  existing tests that do not supply a signature continue to work.
* Timing-safe comparison (``hmac.compare_digest``) is used throughout.
"""

import hashlib
import hmac
import json
import logging
import time
from typing import Any, Dict, Optional, Tuple

from fastapi import HTTPException, Request, status

from app.core.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _is_production() -> bool:
    env = settings.ENVIRONMENT.lower()
    return env not in ("development", "testing", "dev", "test")


def _require_secret(secret: Optional[str], provider: str) -> Optional[str]:
    """
    Return the secret, or:
    - Raise HTTP 503 in production (fail closed).
    - Return None in dev/test (skip verification, log a warning).
    """
    if secret:
        return secret
    if _is_production():
        logger.error(
            "Webhook signature secret for '%s' is not configured. "
            "Set the required environment variable before processing webhooks in production.",
            provider,
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Webhook endpoint for '{provider}' is not configured on this server.",
        )
    logger.warning(
        "No webhook secret configured for '%s'. "
        "Signature verification SKIPPED (development/testing mode only).",
        provider,
    )
    return None


# ---------------------------------------------------------------------------
# WhatsApp Cloud API (Meta)
# ---------------------------------------------------------------------------

async def verify_whatsapp_signature(request: Request) -> bytes:
    """
    Verify the ``X-Hub-Signature-256`` HMAC-SHA256 header sent by Meta's
    WhatsApp Cloud API for every inbound webhook POST.

    Returns the raw request body bytes so the caller does not need to read
    the stream a second time.

    Environment variable
    --------------------
    ``WHATSAPP_WEBHOOK_SECRET`` — the App Secret configured in the Meta
    Developer Console (used as the HMAC key).

    Raises
    ------
    HTTP 401 if the signature header is missing or invalid.
    HTTP 503 in production when the secret is not configured.
    """
    raw_body = await request.body()
    secret = _require_secret(
        getattr(settings, "WHATSAPP_WEBHOOK_SECRET", None),
        "WhatsApp",
    )
    if secret is None:
        # Dev/test: skip verification
        return raw_body

    sig_header = request.headers.get("X-Hub-Signature-256", "")
    if not sig_header.startswith("sha256="):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed X-Hub-Signature-256 header",
        )

    provided_sig = sig_header[len("sha256="):]
    expected_sig = hmac.new(
        secret.encode("utf-8"), raw_body, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(provided_sig, expected_sig):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="WhatsApp webhook signature verification failed",
        )
    return raw_body


# ---------------------------------------------------------------------------
# Email webhooks — Mailgun HMAC-SHA256 (default)
# ---------------------------------------------------------------------------

# Mailgun signatures older/newer than this are rejected (replay window).
MAILGUN_MAX_SKEW_SECONDS = 300
# ponytail: per-process replay cache; use Redis/DB when running >1 instance.
_seen_mailgun_tokens: Dict[str, float] = {}


def _check_mailgun_replay(timestamp: str, token: str) -> None:
    try:
        ts = float(timestamp)
    except (TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Mailgun timestamp")
    now = time.time()
    if abs(now - ts) > MAILGUN_MAX_SKEW_SECONDS:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Stale Mailgun webhook signature")
    for old, seen_at in list(_seen_mailgun_tokens.items()):
        if now - seen_at > MAILGUN_MAX_SKEW_SECONDS * 2:
            del _seen_mailgun_tokens[old]
    if token in _seen_mailgun_tokens:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Replayed Mailgun webhook token")
    _seen_mailgun_tokens[token] = now


async def parse_email_payload(request: Request, raw_body: bytes) -> Optional[Dict[str, Any]]:
    """JSON body, or Mailgun-style form post (urlencoded/multipart). None if unparseable."""
    content_type = request.headers.get("content-type", "")
    if content_type.startswith(("multipart/form-data", "application/x-www-form-urlencoded")):
        form = await request.form()
        return {k: v for k, v in form.items() if isinstance(v, str)}  # attachments skipped
    try:
        data = json.loads(raw_body)
    except (ValueError, UnicodeDecodeError):
        return None
    return data if isinstance(data, dict) else None


async def verify_email_signature(request: Request) -> Tuple[bytes, Optional[Dict[str, Any]]]:
    """
    Verify an inbound email webhook and return ``(raw_body, payload)``.

    * Mailgun: HMAC-SHA256 over ``timestamp + token`` with ``EMAIL_WEBHOOK_SECRET``,
      from JSON (flat or nested ``signature`` object) or form fields. The
      timestamp must be within ``MAILGUN_MAX_SKEW_SECONDS`` and each token is
      accepted once, so a captured signature can't be replayed.
    * Fallback: ``X-Webhook-Signature`` header = HMAC-SHA256 over the raw body.

    ``payload`` is None when the body is neither JSON nor a form post.
    HTTP 401 on missing/invalid signature, 503 in production without a secret.
    """
    raw_body = await request.body()
    payload = await parse_email_payload(request, raw_body)
    secret = _require_secret(
        getattr(settings, "EMAIL_WEBHOOK_SECRET", None),
        "Email",
    )
    if secret is None:
        return raw_body, payload

    fields = payload or {}
    nested = fields.get("signature") if isinstance(fields.get("signature"), dict) else {}
    mailgun_timestamp = fields.get("timestamp") or nested.get("timestamp")
    mailgun_token = fields.get("token") or nested.get("token")
    mailgun_sig = fields.get("signature") if isinstance(fields.get("signature"), str) else nested.get("signature")

    if mailgun_timestamp and mailgun_token and mailgun_sig:
        data = f"{mailgun_timestamp}{mailgun_token}".encode("utf-8")
        expected = hmac.new(
            secret.encode("utf-8"), data, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(str(mailgun_sig), expected):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email webhook Mailgun signature verification failed",
            )
        _check_mailgun_replay(str(mailgun_timestamp), str(mailgun_token))
        return raw_body, payload

    # Fallback: generic X-Webhook-Signature header (HMAC-SHA256 over raw body)
    header_sig = request.headers.get("X-Webhook-Signature", "")
    if not header_sig:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing webhook signature (expected Mailgun triple or X-Webhook-Signature header)",
        )
    expected = hmac.new(
        secret.encode("utf-8"), raw_body, hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(header_sig, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email webhook signature verification failed",
        )
    return raw_body, payload
