"""
مدیریت JSON Web Tokens
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import JWTError, jwt
from pydantic import BaseModel

from app.config.settings import get_settings
from app.shared.enums import UserRole

settings = get_settings()


class TokenPayload(BaseModel):
    """ساختار payload توکن JWT"""
    sub: str           # user_id
    role: str          # UserRole
    jti: str           # JWT ID — برای blacklist
    type: str          # "access" یا "refresh"
    exp: datetime
    iat: datetime


class TokenPair(BaseModel):
    """جفت توکن access و refresh"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int    # ثانیه


def create_access_token(
    user_id: str,
    role: UserRole,
    expires_delta: Optional[timedelta] = None,
) -> tuple[str, str]:
    """
    ایجاد Access Token

    Returns:
        (token_string, jti)
    """
    jti = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    if expires_delta is None:
        expires_delta = timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    expire = now + expires_delta

    payload = {
        "sub": str(user_id),
        "role": role.value,
        "jti": jti,
        "type": "access",
        "exp": expire,
        "iat": now,
    }

    token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

    return token, jti


def create_refresh_token(
    user_id: str,
    role: UserRole,
) -> tuple[str, str]:
    """
    ایجاد Refresh Token

    Returns:
        (token_string, jti)
    """
    jti = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": str(user_id),
        "role": role.value,
        "jti": jti,
        "type": "refresh",
        "exp": expire,
        "iat": now,
    }

    token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

    return token, jti


def create_token_pair(user_id: str, role: UserRole) -> TokenPair:
    """
    ایجاد جفت توکن access و refresh
    """
    access_token, _ = create_access_token(user_id, role)
    refresh_token, _ = create_refresh_token(user_id, role)

    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def decode_token(token: str) -> TokenPayload:
    """
    رمزگشایی و اعتبارسنجی توکن

    Raises:
        JWTError: اگر توکن نامعتبر یا منقضی باشد
    """
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
    )

    return TokenPayload(
        sub=payload["sub"],
        role=payload["role"],
        jti=payload["jti"],
        type=payload["type"],
        exp=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
        iat=datetime.fromtimestamp(payload["iat"], tz=timezone.utc),
    )


def get_jti_from_token(token: str) -> Optional[str]:
    """
    استخراج JTI از توکن بدون اعتبارسنجی کامل
    (برای blacklist کردن توکن‌های منقضی)
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_exp": False},
        )
        return payload.get("jti")
    except JWTError:
        return None