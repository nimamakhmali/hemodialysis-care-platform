"""
Schema های پنل ادمین
"""
import re
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator

from app.shared.enums import UserRole


class AdminUserCreateRequest(BaseModel):
    phone_number: str
    full_name: str
    role: UserRole
    password: str

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        if v.startswith("+98"):
            v = "0" + v[3:]
        elif v.startswith("0098"):
            v = "0" + v[4:]
        if not re.match(r'^09\d{9}$', v):
            raise ValueError("فرمت شماره موبایل نامعتبر است (مثال: 09123456789)")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("نام کاربر معتبر نیست")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("رمز عبور باید حداقل ۸ کاراکتر باشد")
        return v


class AdminUserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 2:
                raise ValueError("نام کاربر معتبر نیست")
        return v


class AdminResetPasswordRequest(BaseModel):
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("رمز عبور باید حداقل ۸ کاراکتر باشد")
        return v


class AdminUserResponse(BaseModel):
    id: UUID
    phone_number: str
    full_name: str
    role: UserRole
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[UUID] = None
    user_name: Optional[str] = None
    action: str
    entity_type: str
    entity_id: str
    old_values: Optional[dict] = None
    new_values: Optional[dict] = None
    ip_address: Optional[str] = None
    timestamp: datetime


class SystemHealthResponse(BaseModel):
    database: str
    redis: str
    celery: str


class SystemStatsResponse(BaseModel):
    total_users: int
    users_by_role: dict
    total_patients: int
    active_patients: int
    inactive_patients: int