import uuid
from datetime import date, time, datetime
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint, Date, DateTime, Enum as SAEnum,
    Float, ForeignKey, Index, Integer, String, Text, Time, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import BaseModel
from app.shared.enums import SessionEvent

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.patient import Patient
    from app.models.alert import Alert
    from app.models.symptom_report import SymptomReport


class DialysisSession(BaseModel):
    """
    جدول جلسات همودیالیز

    هر رکورد نمایانگر یک جلسه دیالیز برای یک بیمار است.
    اطلاعات وزن و فشار خون مهم‌ترین داده‌های هر جلسه هستند.

    قوانین کلیدی:
    - هر بیمار در هر روز حداکثر یک جلسه ثبت می‌شود
    - post_weight باید کمتر یا مساوی pre_weight باشد
    - وزن خشک در زمان جلسه به عنوان snapshot ذخیره می‌شود
    - محاسبه IDWG و UF به صورت خودکار در سرویس انجام می‌شود
    """
    __tablename__ = "dialysis_sessions"

    __table_args__ = (
        # یک جلسه در هر روز برای هر بیمار
        UniqueConstraint(
            "patient_id", "session_date",
            name="uq_session_patient_date",
        ),
        # ایندکس ترکیبی برای query های رایج
        Index("ix_session_patient_date", "patient_id", "session_date"),
        # بررسی منطقی وزن
        CheckConstraint(
            "pre_weight > 0",
            name="ck_session_pre_weight_positive",
        ),
        CheckConstraint(
            "post_weight IS NULL OR post_weight > 0",
            name="ck_session_post_weight_positive",
        ),
        CheckConstraint(
            "post_weight IS NULL OR post_weight <= pre_weight",
            name="ck_session_post_lte_pre",
        ),
        CheckConstraint(
            "duration_minutes IS NULL OR "
            "(duration_minutes >= 60 AND duration_minutes <= 480)",
            name="ck_session_duration_range",
        ),
        # بررسی منطقی فشار خون (systolic > diastolic)
        CheckConstraint(
            "bp_pre_systolic IS NULL OR bp_pre_diastolic IS NULL OR "
            "bp_pre_systolic > bp_pre_diastolic",
            name="ck_bp_pre_systolic_gt_diastolic",
        ),
        CheckConstraint(
            "bp_during_systolic IS NULL OR bp_during_diastolic IS NULL OR "
            "bp_during_systolic > bp_during_diastolic",
            name="ck_bp_during_systolic_gt_diastolic",
        ),
        CheckConstraint(
            "bp_post_systolic IS NULL OR bp_post_diastolic IS NULL OR "
            "bp_post_systolic > bp_post_diastolic",
            name="ck_bp_post_systolic_gt_diastolic",
        ),
    )

    # ==========================================
    # ارتباط با بیمار
    # ==========================================
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ==========================================
    # زمان جلسه
    # ==========================================
    session_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
        comment="تاریخ جلسه دیالیز",
    )

    session_start_time: Mapped[Optional[time]] = mapped_column(
        Time,
        nullable=True,
        comment="ساعت شروع جلسه",
    )

    session_end_time: Mapped[Optional[time]] = mapped_column(
        Time,
        nullable=True,
        comment="ساعت پایان جلسه",
    )

    duration_minutes: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="مدت زمان جلسه به دقیقه (معمولاً 180-240)",
    )

    # ==========================================
    # وزن (مهم‌ترین داده جلسه)
    # ==========================================
    pre_weight: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="وزن قبل از دیالیز (kg)",
    )

    post_weight: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="وزن بعد از دیالیز (kg)",
    )

    # snapshot وزن خشک در زمان جلسه
    # (ممکن است بعداً توسط پزشک تغییر کند)
    dry_weight_at_session: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="وزن خشک هدف در زمان جلسه (snapshot)",
    )

    # ==========================================
    # محاسبات وزن (توسط سرویس محاسبه و ذخیره می‌شود)
    # ==========================================
    weight_gain: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="اضافه وزن نسبت به وزن خشک: pre_weight - dry_weight (kg)",
    )

    weight_gain_percent: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="درصد اضافه وزن نسبت به وزن خشک (IDWG%)",
    )

    uf_volume: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="حجم اولترافیلتراسیون: pre_weight - post_weight (لیتر تقریبی)",
    )

    # ==========================================
    # فشار خون قبل از دیالیز
    # ==========================================
    bp_pre_systolic: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="فشار سیستولیک قبل از دیالیز (mmHg)",
    )

    bp_pre_diastolic: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="فشار دیاستولیک قبل از دیالیز (mmHg)",
    )

    # ==========================================
    # فشار خون حین دیالیز
    # پایین‌ترین مقدار ثبت‌شده در طول جلسه
    # ==========================================
    bp_during_systolic: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="پایین‌ترین فشار سیستولیک حین دیالیز (mmHg) — شاخص IDH",
    )

    bp_during_diastolic: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="پایین‌ترین فشار دیاستولیک حین دیالیز (mmHg)",
    )

    # ==========================================
    # فشار خون بعد از دیالیز
    # ==========================================
    bp_post_systolic: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="فشار سیستولیک بعد از دیالیز (mmHg)",
    )

    bp_post_diastolic: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="فشار دیاستولیک بعد از دیالیز (mmHg)",
    )

    # ==========================================
    # افت فشار (محاسبه‌شده)
    # ==========================================
    bp_drop_during: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment=(
            "افت سیستولیک حین دیالیز نسبت به قبل: "
            "bp_pre_systolic - bp_during_systolic (mmHg)"
        ),
    )

    # ==========================================
    # رخدادهای حین دیالیز
    # ==========================================
    intradialytic_events: Mapped[Optional[List[str]]] = mapped_column(
        ARRAY(String),
        nullable=True,
        comment=(
            "رخدادهای حین دیالیز به صورت آرایه\n"
            "مقادیر: SessionEvent enum\n"
            "مثال: ['hypotension', 'muscle_cramp']"
        ),
    )

    # ==========================================
    # یادداشت
    # ==========================================
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="یادداشت پرستار درباره جلسه",
    )

    # ==========================================
    # ثبت‌کننده
    # ==========================================
    recorded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        comment="کاربری که جلسه را ثبت کرده (پرستار/کلینیسین)",
    )

    # ==========================================
    # Relationships
    # ==========================================
    patient: Mapped["Patient"] = relationship(
        "Patient",
        back_populates="dialysis_sessions",
    )

    recorder: Mapped["User"] = relationship(
        "User",
        foreign_keys=[recorded_by],
    )

    related_alerts: Mapped[List["Alert"]] = relationship(
        "Alert",
        primaryjoin=(
            "and_(Alert.patient_id == DialysisSession.patient_id, "
            "Alert.source_session_id == DialysisSession.id)"
        ),
        foreign_keys="Alert.source_session_id",
        lazy="dynamic",
    )

    def __repr__(self) -> str:
        return (
            f"<DialysisSession id={self.id} "
            f"patient={self.patient_id} "
            f"date={self.session_date} "
            f"pre_weight={self.pre_weight}kg>"
        )

    @property
    def had_intradialytic_hypotension(self) -> bool:
        """آیا در این جلسه افت فشار حین دیالیز رخ داده؟"""
        if self.intradialytic_events:
            return SessionEvent.HYPOTENSION.value in self.intradialytic_events
        if self.bp_drop_during is not None and self.bp_drop_during >= 20:
            return True
        return False

    @property
    def idwg_kg(self) -> Optional[float]:
        """IDWG به کیلوگرم"""
        return self.weight_gain

    @property
    def idwg_percent(self) -> Optional[float]:
        """IDWG به درصد"""
        return self.weight_gain_percent

    @property
    def has_bp_pre(self) -> bool:
        return (
            self.bp_pre_systolic is not None
            and self.bp_pre_diastolic is not None
        )

    @property
    def has_bp_during(self) -> bool:
        return (
            self.bp_during_systolic is not None
            and self.bp_during_diastolic is not None
        )

    @property
    def has_bp_post(self) -> bool:
        return (
            self.bp_post_systolic is not None
            and self.bp_post_diastolic is not None
        )