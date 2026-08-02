import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import (
    DateTime, ForeignKey, Index,
    Integer, JSON, String, Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import BaseModel
from app.shared.enums import SymptomType, SymptomSeverity, DANGER_SYMPTOMS

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.patient import Patient
    from app.models.dialysis_session import DialysisSession


class SymptomReport(BaseModel):
    """
    جدول گزارش علائم بیمار

    بیمار می‌تواند در هر زمان علائم خود را ثبت کند.
    علائم خطرناک (تنگی نفس شدید، درد قفسه سینه) فوری پردازش می‌شوند.

    ساختار symptoms:
    [
        {
            "type": "shortness_of_breath",
            "severity": "moderate",
        },
        {
            "type": "muscle_cramp",
            "severity": "mild",
        }
    ]
    """
    __tablename__ = "symptom_reports"

    __table_args__ = (
        Index("ix_symptom_patient_time", "patient_id", "reported_at"),
    )

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    reported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
        comment="زمان گزارش علامت توسط بیمار",
    )

    # ==========================================
    # علائم (JSON Array)
    # ==========================================
    symptoms: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        comment=(
            "لیست علائم به صورت JSON\n"
            "هر آیتم: {type: SymptomType, severity: SymptomSeverity}"
        ),
    )

    # ==========================================
    # یادداشت اختیاری
    # ==========================================
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="توضیح اضافه بیمار به زبان آزاد",
    )

    # ==========================================
    # لینک به جلسه دیالیز (اختیاری)
    # ==========================================
    related_session_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("dialysis_sessions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="اگر علامت مرتبط با جلسه دیالیز است",
    )

    # ==========================================
    # پرچم علائم خطر (محاسبه‌شده)
    # ==========================================
    has_danger_symptoms: Mapped[bool] = mapped_column(
        nullable=False,
        default=False,
        comment="آیا علائم خطر فوری وجود دارد؟ (chest_pain / severe_sob)",
    )

    # ==========================================
    # Relationships
    # ==========================================
    patient: Mapped["Patient"] = relationship(
        "Patient",
        back_populates="symptom_reports",
    )

    related_session: Mapped[Optional["DialysisSession"]] = relationship(
        "DialysisSession",
        foreign_keys=[related_session_id],
    )

    def __repr__(self) -> str:
        danger = "⚠️ خطر!" if self.has_danger_symptoms else ""
        count = len(self.symptoms) if self.symptoms else 0
        return (
            f"<SymptomReport id={self.id} "
            f"patient={self.patient_id} "
            f"symptoms={count} {danger}>"
        )

    @property
    def symptom_types(self) -> List[str]:
        """لیست نوع علائم"""
        if not self.symptoms:
            return []
        return [s.get("type") for s in self.symptoms if s.get("type")]

    @property
    def has_severe_symptom(self) -> bool:
        """آیا علامتی با شدت SEVERE دارد؟"""
        if not self.symptoms:
            return False
        return any(
            s.get("severity") == SymptomSeverity.SEVERE.value
            for s in self.symptoms
        )

    @classmethod
    def check_danger_symptoms(cls, symptoms: list) -> bool:
        """
        بررسی وجود علائم خطر فوری

        علائم خطر: درد قفسه سینه یا تنگی نفس (با هر شدتی)
        """
        danger_values = {s.value for s in DANGER_SYMPTOMS}
        for symptom in symptoms:
            symptom_type = symptom.get("type", "")
            severity = symptom.get("severity", "")
            # درد قفسه سینه با هر شدتی خطرناک است
            if symptom_type == SymptomType.CHEST_PAIN.value:
                return True
            # تنگی نفس شدید
            if (
                symptom_type == SymptomType.SHORTNESS_OF_BREATH.value
                and severity == SymptomSeverity.SEVERE.value
            ):
                return True
        return False

    def get_symptom_by_type(
        self, symptom_type: SymptomType
    ) -> Optional[dict]:
        """دریافت اطلاعات یک علامت خاص"""
        if not self.symptoms:
            return None
        for s in self.symptoms:
            if s.get("type") == symptom_type.value:
                return s
        return None