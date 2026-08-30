"""
Schema های هشدار و توصیه
"""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator

from app.shared.enums import AlertCategory, AlertSeverity, AlertStatus, RecommendationStatus


class AlertResponse(BaseModel):
    id: UUID
    patient_id: UUID
    patient_name: Optional[str] = None
    severity: AlertSeverity
    category: AlertCategory
    title: str
    clinician_explanation: str
    evidence: Optional[dict]
    triggered_by_rule: str
    status: AlertStatus
    acknowledged_by: Optional[UUID]
    acknowledged_at: Optional[datetime]
    resolved_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertAcknowledgeRequest(BaseModel):
    note: Optional[str] = None


class AlertResolveRequest(BaseModel):
    resolution_note: Optional[str] = None


class AlertListFilter(BaseModel):
    status: Optional[AlertStatus] = None
    severity: Optional[AlertSeverity] = None
    category: Optional[AlertCategory] = None
    page: int = 1
    size: int = 20


class RecommendationResponse(BaseModel):
    id: UUID
    patient_id: UUID
    patient_name: Optional[str] = None
    alert_id: Optional[UUID]
    draft_for_clinician: str
    patient_content: Optional[str]
    education_topic: Optional[str]
    status: RecommendationStatus
    priority: AlertSeverity
    reviewed_by: Optional[UUID]
    reviewed_at: Optional[datetime]
    review_notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class RecommendationApproveRequest(BaseModel):
    """
    درخواست تأیید توصیه

    patient_content اختیاری است:
    اگر وارد نشود، از patient_content پیش‌نویس استفاده می‌شود.
    """
    patient_content: Optional[str] = None
    send_as_message: bool = True  # آیا پیام به بیمار ارسال شود؟

    @field_validator("patient_content")
    @classmethod
    def validate_content(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 10:
                raise ValueError("محتوای پیام بیمار خیلی کوتاه است")
            if len(v) > 2000:
                raise ValueError("محتوای پیام بیمار نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد")
        return v


class RecommendationRejectRequest(BaseModel):
    reason: str

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 5:
            raise ValueError("دلیل رد باید حداقل ۵ کاراکتر باشد")
        return v