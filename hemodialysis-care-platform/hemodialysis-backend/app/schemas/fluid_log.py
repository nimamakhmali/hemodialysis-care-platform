"""
Schema های ثبت مایعات

نکات پزشکی:
- محدودیت مایعات در دیالیز: معمولاً ۵۰۰ml + میزان ادرار روزانه
- در بیماران آنوریک (بدون ادرار): حداکثر ۵۰۰-۷۵۰ml در روز
- IDWG مستقیماً به مصرف مایعات مرتبط است
- هر kg اضافه وزن = تقریباً ۱ لیتر مایع اضافی
"""

from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator

from app.config.thresholds import FLUID_THRESHOLDS


class FluidItemRequest(BaseModel):
    """یک آیتم مایعات (اختیاری، برای ثبت جزئی)"""
    fluid_type: str  # آب، چای، سوپ، میوه، شیر، ...
    amount_ml: int

    @field_validator("amount_ml")
    @classmethod
    def validate_amount(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("مقدار مایع باید بیشتر از صفر باشد")
        if v > 2000:
            raise ValueError(
                "مقدار یک آیتم مایع نمی‌تواند بیشتر از ۲۰۰۰ ml باشد"
            )
        return v

    @field_validator("fluid_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("نوع مایع نمی‌تواند خالی باشد")
        return v


class FluidLogCreateRequest(BaseModel):
    """
    ثبت مصرف مایعات روزانه

    می‌تواند فقط total_ml داشته باشد یا
    items تفصیلی که total از آن‌ها محاسبه می‌شود.
    """
    log_date: date
    total_ml: Optional[int] = None
    items: Optional[List[FluidItemRequest]] = None
    notes: Optional[str] = None

    @field_validator("total_ml")
    @classmethod
    def validate_total(cls, v: Optional[int]) -> Optional[int]:
        if v is not None:
            if v < 0:
                raise ValueError("مقدار مایع نمی‌تواند منفی باشد")
            if v > FLUID_THRESHOLDS.daily_critical_ml:
                raise ValueError(
                    f"مقدار مصرف مایع ({v} ml) بسیار زیاد است. "
                    f"حداکثر قابل قبول: {FLUID_THRESHOLDS.daily_critical_ml} ml"
                )
        return v

    def get_effective_total(self) -> Optional[int]:
        """
        محاسبه total واقعی:
        اگر items وارد شده، از جمع آن‌ها استفاده می‌کند.
        """
        if self.items:
            return sum(item.amount_ml for item in self.items)
        return self.total_ml


class FluidLogResponse(BaseModel):
    id: UUID
    patient_id: UUID
    log_date: date
    total_ml: int
    items: Optional[List[dict]]
    notes: Optional[str]
    status_fa: str  # "مناسب" / "بالاتر از حد توصیه‌شده" / "خیلی زیاد"
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}