import uuid
from typing import Optional, List

from sqlalchemy import (
    Boolean, ForeignKey, Index, JSON, String, Text, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import BaseModel


class EducationContent(BaseModel):
    """
    جدول محتوای آموزشی

    کتابخانه محتوای آموزشی متنی برای بیماران دیالیزی.
    محتوا توسط پزشک/ادمین تأیید و وارد می‌شود.

    سیستم بر اساس وضعیت بیمار، محتوای مرتبط را پیشنهاد می‌دهد.

    topic_code های از پیش تعریف‌شده:
    HIGH_K, LOW_K, HIGH_P, LOW_HB, HIGH_IDWG,
    HIGH_BP, LOW_BP, IDH, LOW_ALB, HIGH_CRP,
    FLUID_CONTROL, PHOSPHATE_BINDER, DIET_GENERAL, ACCESS_CARE
    """
    __tablename__ = "education_contents"

    __table_args__ = (
        UniqueConstraint(
            "topic_code",
            name="uq_education_topic_code",
        ),
        Index("ix_education_is_active", "is_active"),
    )

    # ==========================================
    # شناسه موضوع
    # ==========================================
    topic_code: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
        index=True,
        comment="کد یکتای موضوع (مثال: HIGH_K, HIGH_IDWG)",
    )

    title_fa: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="عنوان فارسی محتوا",
    )

    # ==========================================
    # محتوا
    # ==========================================
    content_fa: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="متن آموزشی کامل به فارسی",
    )

    summary_fa: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="خلاصه کوتاه (برای نمایش در داشبورد)",
    )

    # ==========================================
    # دسته‌بندی و tag
    # ==========================================
    tags: Mapped[Optional[List[str]]] = mapped_column(
        ARRAY(String),
        nullable=True,
        comment=(
            "برچسب‌ها برای جستجو و فیلتر\n"
            "مثال: ['potassium', 'diet', 'lab']"
        ),
    )

    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="general",
        comment="دسته‌بندی: diet / medication / fluid / bp / lab / general",
    )

    # ==========================================
    # شرایط نمایش (برای شخصی‌سازی)
    # ==========================================
    trigger_conditions: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True,
        comment=(
            "شرایطی که این محتوا نمایش داده می‌شود\n"
            "مثال: {lab_code: 'K', direction: 'high', threshold: 5.5}"
        ),
    )

    # ==========================================
    # اولویت نمایش
    # ==========================================
    display_priority: Mapped[int] = mapped_column(
        nullable=False,
        default=5,
        comment="اولویت نمایش: 1 (بالاترین) تا 10 (پایین‌ترین)",
    )

    # ==========================================
    # وضعیت
    # ==========================================
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="آیا این محتوا فعال است؟",
    )

    def __repr__(self) -> str:
        return (
            f"<EducationContent "
            f"code={self.topic_code} "
            f"title='{self.title_fa[:30]}'>"
        )