import uuid
from datetime import date, datetime
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import (
    Boolean, Date, DateTime, Enum as SAEnum,
    Float, ForeignKey, Integer, JSON, String, Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import BaseModel
from app.shared.enums import VascularAccessType, Gender

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.dialysis_session import DialysisSession
    from app.models.lab_result import LabPanel
    from app.models.symptom_report import SymptomReport
    from app.models.fluid_log import FluidLog
    from app.models.diet_log import DietLog
    from app.models.alert import Alert
    from app.models.recommendation import Recommendation
    from app.models.patient_message import PatientMessage


class Patient(BaseModel):
    """
    جدول بیماران

    هر بیمار یک پرونده مستقل دارد.
    ممکن است به یک User متصل باشد (اگر اپ نصب کرده)
    یا بدون حساب کاربری باشد (ثبت توسط پرستار).

    وزن خشک (dry_weight) مهم‌ترین پارامتر بالینی است
    که توسط پزشک تعیین و در صورت نیاز به‌روز می‌شود.
    """
    __tablename__ = "patients"

    
    # ارتباط با User
    
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        unique=True,
        nullable=True,
        index=True,
        comment="اگر بیمار اپ داشته باشد، به جدول users لینک می‌شود",
    )

    
    # اطلاعات شناسایی
    
    medical_record_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
        comment="کد بیمارستانی / شناسه یکتا در مرکز",
    )

    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
        comment="نام و نام خانوادگی",
    )

    date_of_birth: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )

    gender: Mapped[Optional[Gender]] = mapped_column(
        SAEnum(Gender, name="gender_enum"),
        nullable=True,
    )

    phone_number: Mapped[Optional[str]] = mapped_column(
        String(15),
        nullable=True,
        comment="شماره تماس بیمار",
    )

    emergency_contact: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True,
        comment="نام و شماره تماس اضطراری",
    )

    
    # اطلاعات بالینی پایه
    
    dry_weight: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="وزن خشک هدف (kg) — تعیین‌شده توسط پزشک",
    )

    dry_weight_updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="آخرین بار که وزن خشک تغییر کرد",
    )

    dry_weight_updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="کاربری که وزن خشک را آخرین بار تغییر داد",
    )

    vascular_access_type: Mapped[Optional[VascularAccessType]] = mapped_column(
        SAEnum(VascularAccessType, name="vascular_access_type_enum"),
        nullable=True,
        comment="نوع دسترسی عروقی",
    )

    dialysis_frequency_per_week: Mapped[int] = mapped_column(
        Integer,
        default=3,
        nullable=False,
        comment="تعداد جلسات دیالیز در هفته (معمولاً ۳)",
    )

    dialysis_start_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
        comment="تاریخ شروع دیالیز",
    )

    
    # بیماری‌های همراه (Comorbidities)
    
    comorbidities: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True,
        comment=(
            "بیماری‌های همراه به صورت JSON\n"
            "مثال: {diabetes: true, hypertension: true, heart_disease: false}"
        ),
    )

    
    # یادداشت‌های کلینیکی
    
    clinical_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="یادداشت‌های اضافه کلینیکی",
    )

    
    # ارتباط با کلینیسین مسئول
    
    assigned_clinician_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="پزشک یا پرستار ناظر",
    )

    
    # وضعیت
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="آیا بیمار فعال است؟ (soft delete)",
    )

    
    # Relationships
    
    user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="patient_profile",
    )

    assigned_clinician: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[assigned_clinician_id],
    )

    dry_weight_updater: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[dry_weight_updated_by],
    )

    dialysis_sessions: Mapped[List["DialysisSession"]] = relationship(
        "DialysisSession",
        back_populates="patient",
        order_by="desc(DialysisSession.session_date)",
        lazy="dynamic",
    )

    lab_panels: Mapped[List["LabPanel"]] = relationship(
        "LabPanel",
        back_populates="patient",
        order_by="desc(LabPanel.collected_at)",
        lazy="dynamic",
    )

    symptom_reports: Mapped[List["SymptomReport"]] = relationship(
        "SymptomReport",
        back_populates="patient",
        order_by="desc(SymptomReport.reported_at)",
        lazy="dynamic",
    )

    fluid_logs: Mapped[List["FluidLog"]] = relationship(
        "FluidLog",
        back_populates="patient",
        order_by="desc(FluidLog.log_date)",
        lazy="dynamic",
    )

    diet_logs: Mapped[List["DietLog"]] = relationship(
        "DietLog",
        back_populates="patient",
        order_by="desc(DietLog.log_date)",
        lazy="dynamic",
    )

    alerts: Mapped[List["Alert"]] = relationship(
        "Alert",
        back_populates="patient",
        order_by="desc(Alert.created_at)",
        lazy="dynamic",
    )

    recommendations: Mapped[List["Recommendation"]] = relationship(
        "Recommendation",
        back_populates="patient",
        order_by="desc(Recommendation.created_at)",
        lazy="dynamic",
    )

    messages: Mapped[List["PatientMessage"]] = relationship(
        "PatientMessage",
        back_populates="patient",
        order_by="desc(PatientMessage.sent_at)",
        lazy="dynamic",
    )

    def __repr__(self) -> str:
        return (
            f"<Patient id={self.id} "
            f"mrn={self.medical_record_number} "
            f"name={self.full_name}>"
        )

    @property
    def age(self) -> Optional[int]:
        """سن بیمار بر اساس تاریخ تولد"""
        if self.date_of_birth is None:
            return None
        today = date.today()
        return (
            today.year - self.date_of_birth.year
            - (
                (today.month, today.day)
                < (self.date_of_birth.month, self.date_of_birth.day)
            )
        )

    @property
    def has_app_account(self) -> bool:
        """آیا بیمار اپ اندروید نصب کرده (حساب کاربری دارد)؟"""
        return self.user_id is not None