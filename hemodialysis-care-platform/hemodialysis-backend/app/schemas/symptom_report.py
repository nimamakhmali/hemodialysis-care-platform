"""
Schema های گزارش علائم بیمار

نکات پزشکی:
- علائم خطر فوری (DANGER) نیاز به Alert HIGH دارند
- شدت SEVERE + علائم قلبی/تنفسی = اورژانس
- ثبت زمان دقیق برای تحلیل ارتباط با جلسه دیالیز مهم است
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator, model_validator

from app.shared.enums import SymptomSeverity, SymptomType


class SymptomItemRequest(BaseModel):
    """یک علامت با شدت آن"""
    symptom_type: SymptomType
    severity: SymptomSeverity

    @field_validator("symptom_type", mode="before")
    @classmethod
    def validate_symptom_type(cls, v: str) -> SymptomType:
        try:
            return SymptomType(v)
        except ValueError:
            valid = [s.value for s in SymptomType]
            raise ValueError(
                f"نوع علامت '{v}' شناخته‌شده نیست. "
                f"موارد معتبر: {valid}"
            )


class SymptomReportCreateRequest(BaseModel):
    """
    درخواست ثبت گزارش علائم

    می‌تواند توسط بیمار یا کلینیسین ثبت شود.
    زمان گزارش اختیاری است (اگر وارد نشد، زمان جاری استفاده می‌شود).
    """
    reported_at: Optional[datetime] = None
    symptoms: List[SymptomItemRequest]
    notes: Optional[str] = None
    related_session_id: Optional[UUID] = None

    @field_validator("symptoms")
    @classmethod
    def validate_symptoms_not_empty(cls, v: List[SymptomItemRequest]):
        if not v:
            raise ValueError("حداقل یک علامت باید انتخاب شود")
        if len(v) > 20:
            raise ValueError("تعداد علائم ثبت‌شده بیش از حد است")
        # بررسی تکراری نبودن
        types = [s.symptom_type for s in v]
        if len(types) != len(set(types)):
            raise ValueError("هر علامت باید فقط یک بار انتخاب شود")
        return v

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 1000:
            raise ValueError("توضیحات نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد")
        return v


class SymptomReportResponse(BaseModel):
    id: UUID
    patient_id: UUID
    reported_at: datetime
    symptoms: List[dict]
    notes: Optional[str]
    related_session_id: Optional[UUID]
    has_danger_symptoms: bool
    danger_symptoms: List[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class SymptomFrequencyResponse(BaseModel):
    """خلاصه فرکانس علائم برای تحلیل"""
    period_days: int
    total_reports: int
    symptom_counts: dict  # {symptom_type: {total: int, severe: int}}
    most_frequent: Optional[str]
    danger_symptom_occurrences: int