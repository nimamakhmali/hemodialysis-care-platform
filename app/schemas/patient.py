"""
Schema های بیمار
"""

import re
from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator, model_validator

from app.shared.enums import Gender, VascularAccessType


class PatientCreateRequest(BaseModel):
    medical_record_number: str
    full_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    phone_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    dry_weight: float
    vascular_access_type: Optional[VascularAccessType] = None
    dialysis_frequency_per_week: int = 3
    dialysis_start_date: Optional[date] = None
    comorbidities: Optional[dict] = None
    clinical_notes: Optional[str] = None
    assigned_clinician_id: Optional[UUID] = None

    @field_validator("medical_record_number")
    @classmethod
    def validate_mrn(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) < 3:
            raise ValueError("کد بیمارستانی معتبر نیست")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) < 2:
            raise ValueError("نام بیمار معتبر نیست")
        return v

    @field_validator("dry_weight")
    @classmethod
    def validate_dry_weight(cls, v: float) -> float:
        if v <= 0 or v < 20 or v > 250:
            raise ValueError(
                "وزن خشک باید بین ۲۰ تا ۲۵۰ کیلوگرم باشد"
            )
        return v

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if v.startswith("+98"):
            v = "0" + v[3:]
        if not re.match(r'^09\d{9}$', v):
            raise ValueError(
                "فرمت شماره موبایل نامعتبر است"
            )
        return v

    @field_validator("dialysis_frequency_per_week")
    @classmethod
    def validate_frequency(cls, v: int) -> int:
        if not (2 <= v <= 7):
            raise ValueError(
                "تعداد جلسات دیالیز باید بین ۲ تا ۷ در هفته باشد"
            )
        return v


class PatientUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    phone_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    dry_weight: Optional[float] = None
    vascular_access_type: Optional[VascularAccessType] = None
    dialysis_frequency_per_week: Optional[int] = None
    dialysis_start_date: Optional[date] = None
    comorbidities: Optional[dict] = None
    clinical_notes: Optional[str] = None
    assigned_clinician_id: Optional[UUID] = None

    @field_validator("dry_weight")
    @classmethod
    def validate_dry_weight(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v <= 0 or v < 20 or v > 250):
            raise ValueError(
                "وزن خشک باید بین ۲۰ تا ۲۵۰ کیلوگرم باشد"
            )
        return v


class PatientResponse(BaseModel):
    id: UUID
    medical_record_number: str
    full_name: str
    date_of_birth: Optional[date]
    gender: Optional[Gender]
    phone_number: Optional[str]
    emergency_contact: Optional[str]
    dry_weight: float
    dry_weight_updated_at: Optional[str]
    vascular_access_type: Optional[VascularAccessType]
    dialysis_frequency_per_week: int
    dialysis_start_date: Optional[date]
    comorbidities: Optional[dict]
    clinical_notes: Optional[str]
    assigned_clinician_id: Optional[UUID]
    is_active: bool
    has_app_account: bool
    age: Optional[int]

    model_config = {"from_attributes": True}


class PatientSummaryResponse(BaseModel):
    """خلاصه داشبورد بیمار برای لیست کلینیسین"""
    id: UUID
    medical_record_number: str
    full_name: str
    dry_weight: float
    age: Optional[int]
    vascular_access_type: Optional[VascularAccessType]
    assigned_clinician_id: Optional[UUID]
    has_app_account: bool

    # آمار هشدار
    active_alerts_high: int = 0
    active_alerts_medium: int = 0
    active_alerts_low: int = 0
    pending_recommendations: int = 0

    # آخرین داده‌ها
    last_session_date: Optional[date] = None
    last_lab_date: Optional[date] = None
    last_pre_weight: Optional[float] = None
    last_idwg_percent: Optional[float] = None

    model_config = {"from_attributes": True}