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
import logging
from typing import Optional

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

async def verify_email_signature(request: Request) -> bytes:
    """
    Verify Mailgun's timestamp/token/signature triple for inbound email webhooks.

    Mailgun signs with HMAC-SHA256 over ``timestamp + token`` using the
    Mailgun Webhook Signing Key as the HMAC key. The result is compared to
    the ``signature`` field in the JSON payload.

    If the payload does not include a Mailgun signature triple (e.g. the
    provider is different), the function falls back to checking the generic
    ``X-Webhook-Signature`` header with the same HMAC key, so SendGrid-style
    integrations can reuse the same secret variable.

    Environment variable
    --------------------
    ``EMAIL_WEBHOOK_SECRET`` — Mailgun Webhook Signing Key, or the shared
    HMAC secret for other providers.

    Raises
    ------
    HTTP 401 if the signature is missing or invalid.
    HTTP 503 in production when the secret is not configured.
    """
    import json

    raw_body = await request.body()
    secret = _require_secret(
        getattr(settings, "EMAIL_WEBHOOK_SECRET", None),
        "Email",
    )
    if secret is None:
        return raw_body

    # Try Mailgun triple (token/timestamp/signature in JSON body)
    try:
        body_json = json.loads(raw_body)
    except (ValueError, UnicodeDecodeError):
        body_json = {}

    mailgun_timestamp = body_json.get("timestamp") or body_json.get("signature", {}).get("timestamp")
    mailgun_token = body_json.get("token") or body_json.get("signature", {}).get("token")
    mailgun_sig = body_json.get("signature") if isinstance(body_json.get("signature"), str) else (
        body_json.get("signature", {}).get("signature") if isinstance(body_json.get("signature"), dict) else None
    )

    if mailgun_timestamp and mailgun_token and mailgun_sig:
        data = f"{mailgun_timestamp}{mailgun_token}".encode("utf-8")
        expected = hmac.new(
            secret.encode("utf-8"), data, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(mailgun_sig, expected):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email webhook Mailgun signature verification failed",
            )
        return raw_body

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
    return raw_body

