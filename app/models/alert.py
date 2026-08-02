import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import (
    Boolean, DateTime, Enum as SAEnum,
    ForeignKey, Index, JSON, String, Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import BaseModel
from app.shared.enums import AlertSeverity, AlertCategory, AlertStatus

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.patient import Patient
    from app.models.recommendation import Recommendation


class Alert(BaseModel):
    """
    جدول هشدارهای سیستم

    هشدارها توسط موتور تحلیل (Rule Engine) تولید می‌شوند.
    سه سطح دارند: LOW، MEDIUM، HIGH.

    هشدار HIGH به صورت خودکار یک RecommendationDraft ایجاد می‌کند.
    هشدارها برای کادر درمان (کلینیسین) نمایش داده می‌شوند.
    بیمار فقط پیام‌های تأییدشده توسط پزشک را می‌بیند.
    """
    __tablename__ = "alerts"

    __table_args__ = (
        Index("ix_alert_patient_status", "patient_id", "status"),
        Index("ix_alert_patient_severity", "patient_id", "severity"),
        Index("ix_alert_created", "created_at"),
    )

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ==========================================
    # طبقه‌بندی هشدار
    # ==========================================
    severity: Mapped[AlertSeverity] = mapped_column(
        SAEnum(AlertSeverity, name="alert_severity_enum"),
        nullable=False,
        index=True,
        comment="شدت هشدار: low/medium/high",
    )

    category: Mapped[AlertCategory] = mapped_column(
        SAEnum(AlertCategory, name="alert_category_enum"),
        nullable=False,
        index=True,
        comment="دسته‌بندی: weight/bp/lab/symptom/fluid/diet/combined",
    )

    # ==========================================
    # محتوای هشدار
    # ==========================================
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="عنوان کوتاه هشدار",
    )

    clinician_explanation: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="توضیح کامل برای کادر درمان (چرا این هشدار؟)",
    )

    # ==========================================
    # شواهد و دلیل (برای Explainability)
    # ==========================================
    evidence: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True,
        comment=(
            "داده‌هایی که منجر به این هشدار شدند\n"
            "مثال: {K_value: 6.2, K_date: '2024-01-01', threshold: 6.0}"
        ),
    )

    triggered_by_rule: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="نام rule که این هشدار را ایجاد کرده",
    )

    # ==========================================
    # منبع هشدار (اختیاری — برای ردیابی)
    # ==========================================
    source_session_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("dialysis_sessions.id", ondelete="SET NULL"),
        nullable=True,
        comment="جلسه دیالیزی که این هشدار از آن گرفته شده",
    )

    source_panel_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("lab_panels.id", ondelete="SET NULL"),
        nullable=True,
        comment="پنل آزمایشی که این هشدار از آن گرفته شده",
    )

    source_symptom_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("symptom_reports.id", ondelete="SET NULL"),
        nullable=True,
        comment="گزارش علامتی که این هشدار از آن گرفته شده",
    )

    # ==========================================
    # وضعیت هشدار
    # ==========================================
    status: Mapped[AlertStatus] = mapped_column(
        SAEnum(AlertStatus, name="alert_status_enum"),
        default=AlertStatus.NEW,
        nullable=False,
        index=True,
    )

    acknowledged_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="کلینیسینی که هشدار را دیده است",
    )

    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ==========================================
    # Relationships
    # ==========================================
    patient: Mapped["Patient"] = relationship(
        "Patient",
        back_populates="alerts",
    )

    acknowledger: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[acknowledged_by],
    )

    recommendation: Mapped[Optional["Recommendation"]] = relationship(
        "Recommendation",
        back_populates="alert",
        uselist=False,
    )

    def __repr__(self) -> str:
        return (
            f"<Alert id={self.id} "
            f"severity={self.severity.value} "
            f"category={self.category.value} "
            f"status={self.status.value}>"
        )

    @property
    def is_new(self) -> bool:
        return self.status == AlertStatus.NEW

    @property
    def is_high_priority(self) -> bool:
        return self.severity == AlertSeverity.HIGH