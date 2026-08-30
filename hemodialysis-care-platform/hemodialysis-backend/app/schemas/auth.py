"""
Schema های احراز هویت
"""

import re
from typing import Optional
from pydantic import BaseModel, field_validator, model_validator

from app.shared.enums import UserRole


class LoginRequest(BaseModel):
    """درخواست ورود به سیستم"""
    phone_number: str
    password: str

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        # حذف پیش‌شماره‌های مختلف
        if v.startswith("+98"):
            v = "0" + v[3:]
        elif v.startswith("0098"):
            v = "0" + v[4:]

        if not re.match(r'^09\d{9}$', v):
            raise ValueError("فرمت شماره موبایل نامعتبر است (مثال: 09123456789)")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("رمز عبور نمی‌تواند خالی باشد")
        return v


class TokenResponse(BaseModel):
    """پاسخ توکن"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

    class UserInfo(BaseModel):
        id: str
        full_name: str
        phone_number: str
        role: UserRole

    user: UserInfo


class RefreshRequest(BaseModel):
    """درخواست تجدید توکن"""
    refresh_token: str


class AccessTokenResponse(BaseModel):
    """پاسخ access token جدید"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class ChangePasswordRequest(BaseModel):
    """درخواست تغییر رمز عبور"""
    old_password: str
    new_password: str
    confirm_new_password: str

    @model_validator(mode="after")
    def passwords_match(self) -> "ChangePasswordRequest":
        if self.new_password != self.confirm_new_password:
            raise ValueError("رمز عبور جدید و تکرار آن یکسان نیستند")
        return self


class LogoutRequest(BaseModel):
    """درخواست خروج"""
    refresh_token: Optional[str] = None