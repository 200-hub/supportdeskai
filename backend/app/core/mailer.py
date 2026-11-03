"""Minimal outbound email via stdlib smtplib (STARTTLS)."""
import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send(to: str, subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
        smtp.starttls()
        if settings.SMTP_USER:
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD or "")
        smtp.send_message(msg)


async def send_email(to: str, subject: str, body: str) -> bool:
    """Send an email; returns False (and logs) if SMTP isn't configured or sending fails."""
    if not settings.SMTP_HOST:
        logger.warning("SMTP_HOST not set; email to %s (%s) was not sent", to, subject)
        return False
    try:
        await asyncio.to_thread(_send, to, subject, body)
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to)
        return False
