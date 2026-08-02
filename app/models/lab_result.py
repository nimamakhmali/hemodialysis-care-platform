import uuid
from datetime import date, datetime
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import (
    Boolean, CheckConstraint, Date, DateTime,
    Enum as SAEnum, Float, ForeignKey,
    Index, Integer, String, Text, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import BaseModel
from app.config.database import Base
from app.shared.enums import LabTestCode, AbnormalityDirection

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.patient import Patient
    from app.models.alert import Alert


class LabReferenceRange(Base):
    """
    جدول محدوده‌های مرجع آزمایش‌ها

    این جدول توسط seed داده‌پردازی می‌شود و
    مقادیر نرمال، هشدار و بحرانی هر تست را نگه می‌دارد.
    در MVP فقط توسط ادمین قابل ویرایش است.
    """
    __tablename__ = "lab_reference_ranges"

    test_code: Mapped[str] = mapped_column(
        String(20),
        primary_key=True,
        comment="کد یکتای آزمایش (مثال: K, Hb, P)",
    )

    name_fa: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="نام فارسی آزمایش",
    )

    unit: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="واحد اندازه‌گیری",
    )

    # محدوده نرمال
    normal_low: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    normal_high: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # محدوده هشدار (برای بیماران دیالیزی ممکن است با نرمال فرق داشته باشد)
    warning_low: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    warning_high: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # محدوده بحرانی
    critical_low: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    critical_high: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # محدوده منطقی ورود دستی (جلوگیری از خطای تایپی)
    valid_min: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="حداقل مقدار فیزیولوژیک معقول",
    )
    valid_max: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="حداکثر مقدار فیزیولوژیک معقول",
    )

    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="توضیح درباره این آزمایش برای کادر درمان",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<LabReferenceRange "
            f"code={self.test_code} "
            f"normal={self.normal_low}-{self.normal_high} "
            f"{self.unit}>"
        )

    def is_value_in_normal_range(self, value: float) -> bool:
        """آیا مقدار در محدوده نرمال است؟"""
        low_ok = self.normal_low is None or value >= self.normal_low
        high_ok = self.normal_high is None or value <= self.normal_high
        return low_ok and high_ok

    def classify_value(
        self, value: float
    ) -> tuple[bool, Optional[AbnormalityDirection]]:
        """
        طبقه‌بندی مقدار آزمایش

        Returns:
            (is_abnormal, direction)
            direction: 'high' یا 'low' یا None
        """
        if self.normal_high is not None and value > self.normal_high:
            return True, AbnormalityDirection.HIGH
        if self.normal_low is not None and value < self.normal_low:
            return True, AbnormalityDirection.LOW
        return False, None


class LabPanel(BaseModel):
    """
    جدول پنل آزمایش

    یک پنل نمایانگر مجموعه‌ای از آزمایش‌هایی است که
    در یک تاریخ مشخص از یک بیمار گرفته شده است.
    """
    __tablename__ = "lab_panels"

    __table_args__ = (
        Index("ix_lab_panels_patient_date", "patient_id", "collected_at"),
    )

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    collected_at: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        comment="تاریخ نمونه‌گیری",
    )

    reported_at: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
        comment="تاریخ جواب آزمایش",
    )

    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="یادداشت درباره این پنل آزمایش",
    )

    recorded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        comment="کلینیسینی که نتایج را وارد کرده",
    )

    # ==========================================
    # Relationships
    # ==========================================
    patient: Mapped["Patient"] = relationship(
        "Patient",
        back_populates="lab_panels",
    )

    recorder: Mapped["User"] = relationship(
        "User",
        foreign_keys=[recorded_by],
    )

    results: Mapped[List["LabResult"]] = relationship(
        "LabResult",
        back_populates="panel",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return (
            f"<LabPanel id={self.id} "
            f"patient={self.patient_id} "
            f"date={self.collected_at}>"
        )

    def get_result(self, test_code: LabTestCode) -> Optional["LabResult"]:
        """دریافت نتیجه یک تست خاص از این پنل"""
        for result in self.results:
            if result.test_code == test_code.value:
                return result
        return None

    @property
    def abnormal_results(self) -> List["LabResult"]:
        """لیست نتایج غیرنرمال"""
        return [r for r in self.results if r.is_abnormal]

    @property
    def critical_results(self) -> List["LabResult"]:
        """لیست نتایج بحرانی"""
        return [r for r in self.results if r.is_critical]


class LabResult(BaseModel):
    """
    جدول نتایج آزمایشگاهی تکی

    هر رکورد نتیجه یک آزمایش مشخص در یک پنل را نگه می‌دارد.
    وضعیت انحراف از نرمال به صورت خودکار در سرویس محاسبه می‌شود.
    """
    __tablename__ = "lab_results"

    __table_args__ = (
        # هر تست فقط یک بار در هر پنل
        UniqueConstraint(
            "panel_id", "test_code",
            name="uq_lab_result_panel_test",
        ),
        # ایندکس برای query تاریخچه یک تست برای یک بیمار
        Index(
            "ix_lab_result_patient_test_date",
            "patient_id", "test_code", "created_at",
        ),
        CheckConstraint(
            "value >= 0",
            name="ck_lab_result_value_non_negative",
        ),
    )

    panel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("lab_panels.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ذخیره مستقیم patient_id برای query سریع‌تر
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    test_code: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
        comment="کد آزمایش (مثال: K, Hb, P)",
    )

    value: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="مقدار عددی نتیجه",
    )

    unit: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="واحد اندازه‌گیری",
    )

    # ==========================================
    # محدوده مرجع (snapshot در زمان ثبت)
    # ==========================================
    ref_range_low: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="حد پایین نرمال در زمان ثبت",
    )

    ref_range_high: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="حد بالای نرمال در زمان ثبت",
    )

    # ==========================================
    # وضعیت انحراف (محاسبه‌شده توسط سرویس)
    # ==========================================
    is_abnormal: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="آیا خارج از محدوده نرمال است؟",
    )

    is_critical: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="آیا در محدوده بحرانی است؟",
    )

    abnormality_direction: Mapped[Optional[str]] = mapped_column(
        String(10),
        nullable=True,
        comment="جهت انحراف: 'high' یا 'low'",
    )

    note: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="یادداشت اضافه برای این نتیجه",
    )

    # ==========================================
    # Relationships
    # ==========================================
    panel: Mapped["LabPanel"] = relationship(
        "LabPanel",
        back_populates="results",
    )

    patient: Mapped["Patient"] = relationship(
        "Patient",
        foreign_keys=[patient_id],
    )

    def __repr__(self) -> str:
        status = "⚠️" if self.is_abnormal else "✅"
        return (
            f"<LabResult {status} "
            f"{self.test_code}={self.value}{self.unit}>"
        )

    @property
    def display_value(self) -> str:
        """نمایش مقدار با واحد"""
        return f"{self.value:.2f} {self.unit}"

    @property
    def status_fa(self) -> str:
        """وضعیت فارسی"""
        if self.is_critical:
            return "بحرانی"
        if self.is_abnormal:
            if self.abnormality_direction == AbnormalityDirection.HIGH.value:
                return "بالا"
            return "پایین"
        return "نرمال"