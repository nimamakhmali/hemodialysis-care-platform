import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import (
    DateTime, Enum as SAEnum,
    ForeignKey, Index, JSON, String, Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import BaseModel
from app.shared.enums import RecommendationStatus, AlertSeverity

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.patient import Patient
    from app.models.alert import Alert
    from app.models.patient_message import PatientMessage


class Recommendation(BaseModel):
    """
    جدول توصیه‌های درمانی

    موتور تحلیل یک Draft تولید می‌کند.
    پزشک آن را می‌بیند، ویرایش/تأیید/رد می‌کند.
    فقط موارد تأییدشده به بیمار نمایش داده می‌شود.

    چرخه وضعیت:
    DRAFT → APPROVED (با/بدون ویرایش) → PatientMessage ایجاد می‌شود
    DRAFT → REJECTED → پایان چرخه
    """
    __tablename__ = "recommendations"

    __table_args__ = (
        Index("ix_rec_patient_status", "patient_id", "status"),
        Index("ix_rec_created", "created_at"),
    )

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    alert_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("alerts.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
        comment="هشداری که این توصیه از آن آمده (one-to-one)",
    )

    # ==========================================
    # محتوا برای پزشک
    # ==========================================
    draft_for_clinician: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment=(
            "پیش‌نویس تولیدشده توسط AI برای پزشک\n"
            "ساختار: مشاهدات | روند | ریسک | پیشنهاد بررسی"
        ),
    )

    # ==========================================
    # محتوا برای بیمار (پیش‌نویس)
    # ==========================================
    patient_content: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment=(
            "متن پیشنهادی برای ارسال به بیمار\n"
            "این متن توسط پزشک ویرایش/تأیید می‌شود"
        ),
    )

    education_topic_code: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="کد موضوع آموزشی مرتبط (از جدول education_contents)",
    )

    # ==========================================
    # متادیتای AI
    # ==========================================
    ai_reasoning: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True,
        comment=(
            "دلایل و شواهد تولید این توصیه توسط AI\n"
            "برای Explainability و Audit"
        ),
    )

    # ==========================================
    # اولویت
    # ==========================================
    priority: Mapped[AlertSeverity] = mapped_column(
        SAEnum(AlertSeverity, name="alert_severity_enum", create_constraint=False),
        nullable=False,
        default=AlertSeverity.MEDIUM,
        comment="اولویت بررسی توصیه",
    )

    # ==========================================
    # وضعیت
    # ==========================================
    status: Mapped[RecommendationStatus] = mapped_column(
        SAEnum(RecommendationStatus, name="recommendation_status_enum"),
        default=RecommendationStatus.DRAFT,
        nullable=False,
        index=True,
    )

    # ==========================================
    # اطلاعات بررسی پزشک
    # ==========================================
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    review_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="یادداشت پزشک هنگام ویرایش یا رد",
    )

    # ==========================================
    # Relationships
    # ==========================================
    patient: Mapped["Patient"] = relationship(
        "Patient",
        back_populates="recommendations",
    )

    alert: Mapped[Optional["Alert"]] = relationship(
        "Alert",
        back_populates="recommendation",
    )

    reviewer: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[reviewed_by],
    )

    patient_message: Mapped[Optional["PatientMessage"]] = relationship(
        "PatientMessage",
        back_populates="recommendation",
        uselist=False,
    )

    def __repr__(self) -> str:
        return (
            f"<Recommendation id={self.id} "
            f"patient={self.patient_id} "
            f"status={self.status.value} "
            f"priority={self.priority.value}>"
        )

    @property
    def is_pending(self) -> bool:
        return self.status == RecommendationStatus.DRAFT

    @property
    def is_approved(self) -> bool:
        return self.status in (
            RecommendationStatus.APPROVED,
            RecommendationStatus.EDITED,
        )