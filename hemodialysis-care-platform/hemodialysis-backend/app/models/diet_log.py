import uuid
from datetime import date
from typing import Optional, TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint, Date, Enum as SAEnum,
    ForeignKey, Index, Text, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import BaseModel
from app.shared.enums import DietAdherence

if TYPE_CHECKING:
    from app.models.patient import Patient


class DietLog(BaseModel):
    """
    جدول ثبت رژیم غذایی روزانه

    بیمار سطح رعایت محدودیت‌های غذایی مختلف را گزارش می‌دهد.
    این اطلاعات در تحلیل ترکیبی با آزمایش‌ها استفاده می‌شود.

    مثال: P بالا در آزمایش + poor phosphorus adherence
    → هشدار + پیشنهاد آموزش مصرف فسفات‌بایندر

    در هر روز فقط یک رکورد وجود دارد (upsert).

    محدودیت‌های رژیمی اصلی برای بیماران دیالیزی:
    - پتاسیم: میوه‌جات، سبزیجات، آب‌میوه، شکلات
    - فسفر: لبنیات، کنسرو، غذاهای فرآوری‌شده، آجیل
    - پروتئین: گوشت، تخم مرغ (نیاز هست ولی با کنترل)
    - سدیم: نمک، غذاهای شور، ترشی
    - مایعات: همه نوع مایع
    """
    __tablename__ = "diet_logs"

    __table_args__ = (
        UniqueConstraint(
            "patient_id", "log_date",
            name="uq_diet_log_patient_date",
        ),
        Index("ix_diet_log_patient_date", "patient_id", "log_date"),
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
        comment="تاریخ ثبت رژیم",
    )

    # ==========================================
    # سطح رعایت هر محدودیت
    # ==========================================
    potassium_adherence: Mapped[Optional[DietAdherence]] = mapped_column(
        SAEnum(DietAdherence, name="diet_adherence_enum"),
        nullable=True,
        comment=(
            "رعایت محدودیت پتاسیم\n"
            "good=کم‌مصرف، moderate=متوسط، poor=پرمصرف"
        ),
    )

    phosphorus_adherence: Mapped[Optional[DietAdherence]] = mapped_column(
        SAEnum(DietAdherence, name="diet_adherence_enum", create_constraint=False),
        nullable=True,
        comment=(
            "رعایت محدودیت فسفر\n"
            "good=محدودیت رعایت شده، poor=لبنیات و غذای فرآوری زیاد"
        ),
    )

    protein_adherence: Mapped[Optional[DietAdherence]] = mapped_column(
        SAEnum(DietAdherence, name="diet_adherence_enum", create_constraint=False),
        nullable=True,
        comment="رعایت توصیه پروتئین (نه کم نه زیاد)",
    )

    sodium_adherence: Mapped[Optional[DietAdherence]] = mapped_column(
        SAEnum(DietAdherence, name="diet_adherence_enum", create_constraint=False),
        nullable=True,
        comment="رعایت محدودیت سدیم/نمک",
    )

    # ==========================================
    # رعایت مصرف داروهای فسفات‌بایندر
    # ==========================================
    phosphate_binder_taken: Mapped[Optional[bool]] = mapped_column(
        nullable=True,
        comment="آیا داروی فسفات‌بایندر با غذا مصرف شده؟",
    )

    # ==========================================
    # یادداشت
    # ==========================================
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="یادداشت اضافه بیمار (اختیاری)",
    )

    # ==========================================
    # Relationships
    # ==========================================
    patient: Mapped["Patient"] = relationship(
        "Patient",
        back_populates="diet_logs",
    )

    def __repr__(self) -> str:
        return (
            f"<DietLog id={self.id} "
            f"patient={self.patient_id} "
            f"date={self.log_date} "
            f"K={self.potassium_adherence} "
            f"P={self.phosphorus_adherence}>"
        )

    @property
    def overall_adherence(self) -> DietAdherence:
        """
        ارزیابی کلی رعایت رژیم

        بر اساس بدترین سطح رعایت در میان همه موارد
        """
        values = [
            v for v in [
                self.potassium_adherence,
                self.phosphorus_adherence,
                self.protein_adherence,
                self.sodium_adherence,
            ]
            if v is not None
        ]

        if not values:
            return DietAdherence.GOOD

        if DietAdherence.POOR in values:
            return DietAdherence.POOR
        if DietAdherence.MODERATE in values:
            return DietAdherence.MODERATE
        return DietAdherence.GOOD

    @property
    def poor_items(self) -> list[str]:
        """لیست مواردی که رعایت ضعیف بوده"""
        items = []
        mapping = {
            "potassium_adherence": "پتاسیم",
            "phosphorus_adherence": "فسفر",
            "protein_adherence": "پروتئین",
            "sodium_adherence": "سدیم",
        }
        for field, name_fa in mapping.items():
            val = getattr(self, field)
            if val == DietAdherence.POOR:
                items.append(name_fa)
        return items