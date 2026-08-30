import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import BaseModel
from app.shared.enums import UserRole

if TYPE_CHECKING:
    from app.models.patient import Patient


class User(BaseModel):
    """
    جدول کاربران سیستم

    تمام نقش‌ها (بیمار، کلینیسین، ادمین) در یک جدول نگهداری می‌شوند.
    تمایز آن‌ها از طریق فیلد role انجام می‌شود.

    نکته: بیمار ممکن است حساب کاربری نداشته باشد (مثلاً ثبت شده توسط پرستار
    و اپ اندروید نصب نکرده). در این حالت user_id در Patient خالی است.
    """
    __tablename__ = "users"

    
    # اطلاعات اصلی
    
    phone_number: Mapped[str] = mapped_column(
        String(15),
        unique=True,
        index=True,
        nullable=False,
        comment="شماره موبایل — مبنای احراز هویت",
    )

    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        comment="نام و نام خانوادگی",
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    
    # نقش و وضعیت
    
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role_enum"),
        nullable=False,
        index=True,
        comment="نقش کاربر در سیستم",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="آیا کاربر فعال است؟",
    )

    
    # اطلاعات ورود
    
    last_login: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="آخرین زمان ورود به سیستم",
    )

    
    # Relationships
    
    # اگر این کاربر یک بیمار باشد
    patient_profile: Mapped[Optional["Patient"]] = relationship(
        "Patient",
        foreign_keys="Patient.user_id",
        back_populates="user",
        uselist=False,
    )

    def __repr__(self) -> str:
        return (
            f"<User id={self.id} "
            f"phone={self.phone_number} "
            f"role={self.role.value}>"
        )

    @property
    def is_patient(self) -> bool:
        return self.role == UserRole.PATIENT

    @property
    def is_clinician(self) -> bool:
        return self.role == UserRole.CLINICIAN

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN