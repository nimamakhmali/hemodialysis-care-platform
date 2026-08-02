"""
Schema های ثبت رژیم غذایی

نکات پزشکی:
- محدودیت‌های اصلی دیالیز:
  * پتاسیم: < 2000mg/day (میوه و سبزی تازه محدود)
  * فسفر: < 800mg/day + فسفات‌بایندر
  * سدیم: < 2000mg/day (برای کنترل تشنگی/مایعات)
  * پروتئین: 1.2g/kg/day (برعکس CKD — نیاز بالاتر دارد)
- رعایت رژیم مستقیماً روی K، P، IDWG تأثیر می‌گذارد
"""

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator

from app.shared.enums import DietAdherence


class DietLogCreateRequest(BaseModel):
    """
    ثبت رژیم روزانه

    سطح رعایت هر محدودیت به صورت categorical
    تا ورود آسان باشد و برای تحلیل مناسب
    """
    log_date: date
    potassium_adherence: DietAdherence
    phosphorus_adherence: DietAdherence
    protein_adherence: DietAdherence
    sodium_adherence: DietAdherence
    fluid_binder_taken: Optional[bool] = None  # آیا فسفات‌بایندر مصرف شد؟
    notes: Optional[str] = None

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 500:
            raise ValueError("توضیحات نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد")
        return v


class DietLogResponse(BaseModel):
    id: UUID
    patient_id: UUID
    log_date: date
    potassium_adherence: DietAdherence
    phosphorus_adherence: DietAdherence
    protein_adherence: DietAdherence
    sodium_adherence: DietAdherence
    fluid_binder_taken: Optional[bool]
    notes: Optional[str]
    overall_score: int  # 0-100 امتیاز کلی رعایت
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class DietAdherenceSummary(BaseModel):
    """خلاصه رعایت رژیم برای تحلیل"""
    period_days: int
    total_logs: int
    potassium_adherence_rate: float  # درصد روزهای GOOD یا MODERATE
    phosphorus_adherence_rate: float
    protein_adherence_rate: float
    sodium_adherence_rate: float
    fluid_binder_rate: Optional[float]  # درصد روزهایی که بایندر خورده
    poor_adherence_streak: int  # چند روز متوالی poor
    overall_score: float