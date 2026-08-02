import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import (
    DateTime, ForeignKey, Index, String, Text
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.patient import Patient
    from app.models.recommendation import Recommendation


class PatientMessage(BaseModel):
    """
    جدول پیام‌های ارسال‌شده به بیمار

    این جدول فقط پیام‌هایی را ذخیره می‌کند که
    توسط پزشک تأیید شده و به بیمار ارسال شده‌اند.

    پیام می‌تواند شامل آموزش، توصیه یا اطلاع‌رسانی باشد.
    بیمار وضعیت خوانده‌شده/نخوانده را می‌بیند.
    """
    __tablename__ = "patient_messages"

    __table_args__ = (
        Index("ix_message_patient_sent", "patient_id", "sent_at"),
        Index("ix_message_read_at", "patient_id", "read_at"),
    )

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    recommendation_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("recommendations.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,
        comment="توصیه‌ای که این پیام از آن ایجاد شده",
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="عنوان پیام",
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="متن کامل پیام تأییدشده توسط پزشک",
    )

    # نوع پیام برای نمایش متفاوت در UI
    message_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="education",
        comment="نوع: education / alert / reminder / general",
    )

    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        comment="زمان ارسال پیام",
    )

    sent_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        comment="کلینیسینی که پیام را تأیید و ارسال کرده",
    )

    read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="زمانی که بیمار پیام را خواند",
    )

    # ==========================================
    # Relationships
    # ==========================================
    patient: Mapped["Patient"] = relationship(
        "Patient",
        back_populates="messages",
    )

    recommendation: Mapped[Optional["Recommendation"]] = relationship(
        "Recommendation",
        back_populates="patient_message",
    )

    sender: Mapped["User"] = relationship(
        "User",
        foreign_keys=[sent_by],
    )

    def __repr__(self) -> str:
        read_status = "✓ خوانده‌شده" if self.read_at else "⬜ جدید"
        return (
            f"<PatientMessage id={self.id} "
            f"patient={self.patient_id} "
            f"title='{self.title[:30]}' "
            f"{read_status}>"
        )

    @property
    def is_read(self) -> bool:
        return self.read_at is not None

    @property
    def is_unread(self) -> bool:
        return self.read_at is None