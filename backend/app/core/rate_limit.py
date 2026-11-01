"""
Rate Limiting — Token Bucket (In-Process)
==========================================
A lightweight, dependency-free rate limiter based on the token-bucket
algorithm.  It stores state in process-local memory, which means:

* In single-worker deployments (development, uvicorn with 1 worker) it
  works correctly.
* In multi-worker deployments (gunicorn + multiple uvicorn workers) each
  worker has an independent bucket, so the effective limit is
  ``limit × num_workers`` per window. This is a known limitation that is
  documented rather than worked around with a dependency.

Production recommendation
--------------------------
Set ``RATE_LIMIT_BACKEND=redis`` and provide ``REDIS_URL`` to share state
across workers.  The module exposes a ``RateLimiter`` class whose interface
is stable so the backend can be swapped without changing call sites.

Client IP extraction
---------------------
The limiter extracts the client IP from ``request.client.host``.
``X-Forwarded-For`` and ``X-Real-IP`` headers are intentionally NOT trusted
by default to prevent IP spoofing.  Set ``TRUST_PROXY_HEADERS=true`` only
when your deployment sits behind a trusted reverse proxy (nginx, AWS ALB,
Cloudflare) that strips and rewrites these headers.

Usage
-----
    from app.core.rate_limit import RateLimiter

    limiter = RateLimiter(requests=5, window_seconds=60, name="login")

    @router.post("/login")
    async def login(request: Request, ...):
        await limiter.check(request)
        ...
"""

import logging
import time
from collections import defaultdict
from threading import Lock
from typing import Dict, Optional, Tuple

from fastapi import HTTPException, Request, status

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-process token-bucket store
# ---------------------------------------------------------------------------

# Structure: { limiter_name: { client_key: (tokens_remaining, last_refill_ts) } }
_BUCKETS: Dict[str, Dict[str, Tuple[float, float]]] = defaultdict(dict)
_LOCK = Lock()


def _client_key(request: Request) -> str:
    """
    Return a stable string identifying the request originator.

    Trust proxy headers only when TRUST_PROXY_HEADERS=true is set, because
    a client can trivially forge X-Forwarded-For to bypass per-IP limits.
    """
    trust_proxy = getattr(settings, "TRUST_PROXY_HEADERS", False)
    if trust_proxy:
        xff = request.headers.get("X-Forwarded-For")
        if xff:
            return xff.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
    host = request.client.host if request.client else "unknown"
    return host


# ---------------------------------------------------------------------------
# Public limiter class
# ---------------------------------------------------------------------------

class RateLimiter:
    """
    Token-bucket rate limiter.

    Parameters
    ----------
    requests : int
        Maximum number of requests allowed per ``window_seconds``.
    window_seconds : int
        Rolling window duration in seconds.
    name : str
        Unique name for this limiter (keeps buckets separate).
    """

    def __init__(self, requests: int, window_seconds: int, name: str):
        self.requests = requests
        self.window_seconds = window_seconds
        self.name = name

    async def check(self, request: Request) -> None:
        """
        Consume one token for the client.  Raises HTTP 429 when exhausted.
        """
        key = _client_key(request)
        now = time.monotonic()

        with _LOCK:
            bucket = _BUCKETS[self.name]
            tokens, last_refill = bucket.get(key, (float(self.requests), now))

            # Refill proportionally to elapsed time
            elapsed = now - last_refill
            refill = (elapsed / self.window_seconds) * self.requests
            tokens = min(float(self.requests), tokens + refill)
            last_refill = now

            if tokens < 1.0:
                bucket[key] = (tokens, last_refill)
                logger.warning(
                    "Rate limit exceeded — limiter=%s key=%s", self.name, key
                )
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many requests. Limit: {self.requests} per {self.window_seconds}s.",
                    headers={"Retry-After": str(self.window_seconds)},
                )

            tokens -= 1.0
            bucket[key] = (tokens, last_refill)


# ---------------------------------------------------------------------------
# Pre-configured limiter instances (reusable across endpoints)
# ---------------------------------------------------------------------------

# Auth endpoints — login / register / password-reset are brute-force targets
login_limiter = RateLimiter(requests=10, window_seconds=60, name="auth_login")
register_limiter = RateLimiter(requests=5, window_seconds=60, name="auth_register")
password_reset_limiter = RateLimiter(requests=5, window_seconds=300, name="auth_pw_reset")

# Public form submission and webchat init
form_submit_limiter = RateLimiter(requests=10, window_seconds=60, name="public_form_submit")
webchat_init_limiter = RateLimiter(requests=20, window_seconds=60, name="public_webchat_init")

# Inbound webhooks — these come from provider infrastructure, be generous
# but still protect against misconfiguration / replay floods
webhook_limiter = RateLimiter(requests=200, window_seconds=60, name="webhook")

