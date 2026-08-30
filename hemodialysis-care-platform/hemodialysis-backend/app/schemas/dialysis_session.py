"""
Schema های جلسه دیالیز
"""

from datetime import date, time
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, field_validator, model_validator

from app.shared.enums import SessionEvent


class DialysisSessionCreateRequest(BaseModel):
    session_date: date
    session_start_time: Optional[time] = None
    session_end_time: Optional[time] = None
    duration_minutes: Optional[int] = None

    # وزن
    pre_weight: float
    post_weight: Optional[float] = None

    # فشار خون
    bp_pre_systolic: Optional[int] = None
    bp_pre_diastolic: Optional[int] = None
    bp_during_systolic: Optional[int] = None
    bp_during_diastolic: Optional[int] = None
    bp_post_systolic: Optional[int] = None
    bp_post_diastolic: Optional[int] = None

    # رخدادها
    intradialytic_events: Optional[List[str]] = None
    notes: Optional[str] = None

    @field_validator("pre_weight")
    @classmethod
    def validate_pre_weight(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("وزن قبل از دیالیز باید بیشتر از صفر باشد")
        if v > 250:
            raise ValueError("وزن وارد‌شده غیرمنطقی است")
        return round(v, 1)

    @field_validator("post_weight")
    @classmethod
    def validate_post_weight(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            if v <= 0:
                raise ValueError("وزن بعد از دیالیز باید بیشتر از صفر باشد")
            if v > 250:
                raise ValueError("وزن وارد‌شده غیرمنطقی است")
            return round(v, 1)
        return v

    @field_validator("duration_minutes")
    @classmethod
    def validate_duration(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (60 <= v <= 480):
            raise ValueError(
                "مدت جلسه باید بین ۶۰ تا ۴۸۰ دقیقه باشد"
            )
        return v

    @model_validator(mode="after")
    def validate_bp_pairs(self) -> "DialysisSessionCreateRequest":
        pairs = [
            (self.bp_pre_systolic, self.bp_pre_diastolic, "قبل"),
            (self.bp_during_systolic, self.bp_during_diastolic, "حین"),
            (self.bp_post_systolic, self.bp_post_diastolic, "بعد"),
        ]
        for sys_val, dia_val, label in pairs:
            if (sys_val is None) != (dia_val is None):
                raise ValueError(
                    f"فشار خون {label} دیالیز: "
                    f"هر دو سیستولیک و دیاستولیک باید با هم وارد شوند"
                )
            if sys_val is not None and dia_val is not None:
                if sys_val <= dia_val:
                    raise ValueError(
                        f"فشار سیستولیک {label} باید "
                        f"بیشتر از دیاستولیک باشد"
                    )
        return self

    @model_validator(mode="after")
    def validate_post_less_than_pre(self) -> "DialysisSessionCreateRequest":
        if (
            self.post_weight is not None
            and self.pre_weight is not None
            and self.post_weight > self.pre_weight
        ):
            raise ValueError(
                "وزن بعد از دیالیز نمی‌تواند بیشتر از وزن قبل باشد"
            )
        return self


class DialysisSessionUpdateRequest(BaseModel):
    post_weight: Optional[float] = None
    bp_during_systolic: Optional[int] = None
    bp_during_diastolic: Optional[int] = None
    bp_post_systolic: Optional[int] = None
    bp_post_diastolic: Optional[int] = None
    intradialytic_events: Optional[List[str]] = None
    notes: Optional[str] = None
    duration_minutes: Optional[int] = None


class DialysisSessionResponse(BaseModel):
    id: UUID
    patient_id: UUID
    session_date: date
    session_start_time: Optional[time]
    duration_minutes: Optional[int]
    pre_weight: float
    post_weight: Optional[float]
    dry_weight_at_session: float
    weight_gain: Optional[float]
    weight_gain_percent: Optional[float]
    uf_volume: Optional[float]
    bp_pre_systolic: Optional[int]
    bp_pre_diastolic: Optional[int]
    bp_during_systolic: Optional[int]
    bp_during_diastolic: Optional[int]
    bp_post_systolic: Optional[int]
    bp_post_diastolic: Optional[int]
    bp_drop_during: Optional[float]
    intradialytic_events: Optional[List[str]]
    notes: Optional[str]
    had_intradialytic_hypotension: bool

    model_config = {"from_attributes": True}