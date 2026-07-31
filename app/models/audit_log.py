import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Index, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config.database import Base
from app.models.user import User


class AuditLog(Base):
    """
    جدول لاگ حسابرسی

    تمام تغییرات مهم سیستم در این جدول ثبت می‌شود.
    این جدول هرگز UPDATE یا DELETE نمی‌شود.

    عمداً از BaseModel ارث نمی‌برد چون updated_at ندارد.
    """
    __tablename__ = "audit_logs"

    __table_args__ = (
        Index("ix_audit_logs_entity", "entity_type", "entity_id"),
        Index("ix_audit_logs_user_timestamp", "user_id", "timestamp"),
        Index("ix_audit_logs_timestamp", "timestamp"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    
    # کاربر انجام‌دهنده
    
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="کاربری که عملیات را انجام داده (null=سیستم)",
    )

    
    # نوع عملیات
    
    action: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment=(
            "نوع عملیات: CREATE, UPDATE, DELETE, "
            "LOGIN, LOGOUT, APPROVE, REJECT, "
            "ACKNOWLEDGE, RESOLVE"
        ),
    )

    
    # موجودیت تغییریافته
    
    entity_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="نام مدل/جدول: Patient, LabResult, Recommendation, ...",
    )

    entity_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="ID موجودیت (به صورت string)",
    )

    
    # مقادیر قدیم و جدید
    
    old_values: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True,
        comment="مقادیر قبل از تغییر",
    )

    new_values: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True,
        comment="مقادیر بعد از تغییر",
    )

    
    # اطلاعات درخواست
    
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
        comment="آدرس IP کاربر",
    )

    user_agent: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        comment="User-Agent مرورگر/اپ",
    )

    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="توضیح اضافه برای درک بهتر لاگ",
    )

    
    # زمان
    
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    
    # Relationships
    
    user: Mapped[Optional[User]] = relationship(
        "User",
        foreign_keys=[user_id],
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<AuditLog id={self.id} "
            f"action={self.action} "
            f"entity={self.entity_type}:{self.entity_id}>"
        )