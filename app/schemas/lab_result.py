"""
Schema های آزمایشگاهی
"""

from datetime import date
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator

from app.shared.constants import LAB_UNITS, LAB_VALID_RANGES
from app.shared.enums import LabTestCode


class LabResultItemRequest(BaseModel):
    """یک نتیجه آزمایش در پنل"""
    test_code: str
    value: float
    unit: str
    note: Optional[str] = None

    @field_validator("test_code")
    @classmethod
    def validate_test_code(cls, v: str) -> str:
        valid = {t.value for t in LabTestCode}
        if v not in valid:
            raise ValueError(
                f"کد آزمایش '{v}' شناخته‌شده نیست. "
                f"کدهای معتبر: {sorted(valid)}"
            )
        return v

    @field_validator("value")
    @classmethod
    def validate_value(cls, v: float) -> float:
        if v < 0:
            raise ValueError("مقدار آزمایش نمی‌تواند منفی باشد")
        return round(v, 4)

    @field_validator("unit")
    @classmethod
    def validate_unit(cls, v: str) -> str:
        return v.strip()


class LabPanelCreateRequest(BaseModel):
    collected_at: date
    reported_at: Optional[date] = None
    notes: Optional[str] = None
    results: List[LabResultItemRequest]

    @field_validator("results")
    @classmethod
    def validate_results_not_empty(cls, v):
        if not v:
            raise ValueError("پنل آزمایش باید حداقل یک نتیجه داشته باشد")
        # بررسی تکراری
        codes = [r.test_code for r in v]
        if len(codes) != len(set(codes)):
            raise ValueError("هر آزمایش باید فقط یک بار در پنل وارد شود")
        return v


class LabResultResponse(BaseModel):
    id: UUID
    test_code: str
    test_name_fa: str
    value: float
    unit: str
    ref_range_low: Optional[float]
    ref_range_high: Optional[float]
    is_abnormal: bool
    is_critical: bool
    abnormality_direction: Optional[str]
    status_fa: str
    note: Optional[str]

    model_config = {"from_attributes": True}


class LabPanelResponse(BaseModel):
    id: UUID
    patient_id: UUID
    collected_at: date
    reported_at: Optional[date]
    notes: Optional[str]
    results: List[LabResultResponse]
    abnormal_count: int
    critical_count: int

    model_config = {"from_attributes": True}


class LabTrendPoint(BaseModel):
    date: date
    value: float
    is_abnormal: bool
    is_critical: bool


class LabTrendResponse(BaseModel):
    test_code: str
    test_name_fa: str
    unit: str
    points: List[LabTrendPoint]
    trend_direction: Optional[str]
    latest_value: Optional[float]
    normal_low: Optional[float]
    normal_high: Optional[float]