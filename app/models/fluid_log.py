import uuid
from datetime import date
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint, Date, ForeignKey,
    Index, Integer, JSON, Text, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import BaseModel

if TYPE_CHECKING:
    from app.models.patient import Patient


# انواع مایعات قابل ثبت
FLUID_ITEM_TYPES = [
    "water",        # آب
    "tea",          # چای
    "coffee",       # قهوه
    "milk",         # شیر
    "juice",        # آبمیوه
    "soup",         # سوپ/آبگوشت
    "ayran",        # دوغ
    "soda",         # نوشابه
    "iv_fluid",     # سرم وریدی (در بیمارستان)
    "other",        # سایر
]


class FluidLog(BaseModel):
    """
    جدول ثبت مصرف مایعات روزانه

    بیمار مصرف روزانه مایعات خود را ثبت می‌کند.
    هدف: پایش احتباس مایعات و ارتباط آن با وزن بین جلسات.

    در هر روز فقط یک رکورد وجود دارد (upsert).
    بیمار می‌تواند در طول روز آن را به‌روزرسانی کند.

    ساختار items (اختیاری):
    [
        {"type": "water", "amount_ml": 250, "time": "08:00"},
        {"type": "tea", "amount_ml": 150, "time": "10:30"},
        {"type": "soup", "amount_ml": 200, "time": "13:00"},
    ]
    """
    __tablename__ = "fluid_logs"

    __table_args__ = (
        # یک رکورد در هر روز برای هر بیمار
        UniqueConstraint(
            "patient_id", "log_date",
            name="uq_fluid_log_patient_date",
        ),
        Index("ix_fluid_log_patient_date", "patient_id", "log_date"),
        CheckConstraint(
            "total_ml >= 0 AND total_ml <= 10000",
            name="ck_fluid_total_ml_range",
        ),
    )

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    log_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
        comment="تاریخ ثبت",
    )

    # ==========================================
    # مجموع روزانه (اصلی‌ترین فیلد)
    # ==========================================
    total_ml: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="مجموع مصرف مایعات روزانه به میلی‌لیتر",
    )

    # ==========================================
    # جزئیات اختیاری (آیتم به آیتم)
    # ==========================================
    items: Mapped[Optional[list]] = mapped_column(
        JSON,
        nullable=True,
        comment=(
            "لیست آیتم‌های مصرفی (اختیاری)\n"
            "هر آیتم: {type, amount_ml, time}"
        ),
    )

    # ==========================================
    # یادداشت
    # ==========================================
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="یادداشت اختیاری بیمار",
    )

    # ==========================================
    # Relationships
    # ==========================================
    patient: Mapped["Patient"] = relationship(
        "Patient",
        back_populates="fluid_logs",
    )

    def __repr__(self) -> str:
        return (
            f"<FluidLog id={self.id} "
            f"patient={self.patient_id} "
            f"date={self.log_date} "
            f"total={self.total_ml}ml>"
        )

    @property
    def total_liters(self) -> float:
        """مجموع به لیتر"""
        return round(self.total_ml / 1000, 2)

    def add_item(self, item_type: str, amount_ml: int, time_str: str = "") -> None:
        """
        افزودن یک آیتم به لیست مصرف و به‌روز کردن total_ml
        """
        if self.items is None:
            self.items = []

        self.items.append({
            "type": item_type,
            "amount_ml": amount_ml,
            "time": time_str,
        })
        self.total_ml = sum(
            item.get("amount_ml", 0) for item in self.items
        )