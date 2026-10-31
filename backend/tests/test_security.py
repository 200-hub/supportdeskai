from datetime import timedelta
import pytest
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)


def test_argon2_password_hashing():
    """
    Test Argon2id password hashing produces valid hashes and verifies correctly.
    """
    raw_password = "SecurePassword123!"
    hashed = hash_password(raw_password)

    assert hashed is not None
    assert hashed != raw_password
    assert hashed.startswith("$argon2id$")

    # Verify matching password
    assert verify_password(raw_password, hashed) is True

    # Verify incorrect password
    assert verify_password("WrongPassword123!", hashed) is False


def test_jwt_access_token_creation_and_decoding():
    """
    Test JWT creation, claim encoding, and signature verification.
    """
    subject = "user-12345"
    claims = {"role": "agent", "email": "agent@supportdesk.io"}
    token = create_access_token(subject=subject, claims=claims)

    assert isinstance(token, str)

    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == subject
    assert payload["role"] == "agent"
    assert payload["email"] == "agent@supportdesk.io"
    assert "exp" in payload
    assert "iat" in payload


def test_jwt_expired_token():
    """
    Test expired JWT token decodes to None.
    """
    subject = "user-expired"
    # Create token expired 1 hour ago
    token = create_access_token(subject=subject, expires_delta=timedelta(hours=-1))
    payload = decode_access_token(token)
    assert payload is None


def test_jwt_invalid_signature():
    """
    Test tampered JWT token decodes to None.
    """
    token = create_access_token(subject="user-tamper")
    tampered_token = token[:-4] + "fake"
    payload = decode_access_token(tampered_token)
    assert payload is None

