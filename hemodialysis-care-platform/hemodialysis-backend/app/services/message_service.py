"""
سرویس پیام‌رسانی به بیمار

قانون اصلی: پیام فقط بعد از تأیید پزشک ارسال می‌شود.
هیچ پیامی بدون Recommendation تأییدشده به بیمار نمی‌رسد.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import Request
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.infrastructure.auditing.logger import audit_logger
from app.models.patient_message import PatientMessage
from app.models.user import User
from app.exceptions.business_exceptions import (
    MessageNotFoundException,
    UnauthorizedAccessException,
)


class MessageService:

    # ============================================================
    # SEND
    # ============================================================

    def send_message_to_patient(
        self,
        db: Session,
        patient_id: uuid.UUID,
        content: str,
        sent_by: User,
        recommendation_id: Optional[uuid.UUID] = None,
        title: Optional[str] = None,
        request: Optional[Request] = None,
    ) -> PatientMessage:
        """
        ارسال پیام به بیمار

        این متد فقط بعد از approve recommendation فراخوانی می‌شود.
        مستقیماً از API قابل فراخوانی نیست — فقط از recommendation workflow.

        Args:
            patient_id: شناسه بیمار
            content: متن پیام (تأییدشده توسط پزشک)
            sent_by: کلینیسین تأییدکننده
            recommendation_id: شناسه توصیه مرتبط
            title: عنوان پیام (اختیاری)
        """
        if not content or len(content.strip()) < 5:
            raise ValueError("محتوای پیام خیلی کوتاه است")

        message = PatientMessage(
            patient_id=patient_id,
            recommendation_id=recommendation_id,
            title=title or "پیام از تیم درمان",
            content=content.strip(),
            sent_at=datetime.now(timezone.utc),
            sent_by=sent_by.id,
        )

        db.add(message)
        db.flush()

        audit_logger.log_create(
            db=db,
            user_id=sent_by.id,
            entity_type="PatientMessage",
            entity_id=str(message.id),
            new_values={
                "patient_id": str(patient_id),
                "recommendation_id": str(recommendation_id) if recommendation_id else None,
                "content_length": len(content),
                "sent_by": str(sent_by.id),
            },
            request=request,
        )

        db.commit()
        db.refresh(message)
        return message

    # ============================================================
    # READ
    # ============================================================

    def get_patient_messages(
        self,
        db: Session,
        patient_id: uuid.UUID,
        unread_only: bool = False,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[PatientMessage], int]:
        """دریافت پیام‌های بیمار"""
        query = db.query(PatientMessage).filter(
            PatientMessage.patient_id == patient_id
        )

        if unread_only:
            query = query.filter(PatientMessage.read_at.is_(None))

        total = query.count()
        messages = (
            query
            .order_by(desc(PatientMessage.sent_at))
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )

        return messages, total

    def get_unread_count(
        self,
        db: Session,
        patient_id: uuid.UUID,
    ) -> int:
        """تعداد پیام‌های خوانده‌نشده"""
        return db.query(PatientMessage).filter(
            PatientMessage.patient_id == patient_id,
            PatientMessage.read_at.is_(None),
        ).count()

    def mark_as_read(
        self,
        db: Session,
        message_id: uuid.UUID,
        patient_id: uuid.UUID,
    ) -> PatientMessage:
        """
        علامت‌گذاری پیام به عنوان خوانده‌شده

        فقط خود بیمار می‌تواند این کار را انجام دهد.
        """
        message = db.query(PatientMessage).filter(
            PatientMessage.id == message_id,
        ).first()

        if not message:
            raise MessageNotFoundException(
                f"پیام با شناسه {message_id} یافت نشد"
            )

        # بررسی دسترسی: فقط بیمار مربوطه
        if message.patient_id != patient_id:
            raise UnauthorizedAccessException(
                "دسترسی به این پیام مجاز نیست"
            )

        if message.read_at is None:
            message.read_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(message)

        return message

    def mark_all_as_read(
        self,
        db: Session,
        patient_id: uuid.UUID,
    ) -> int:
        """علامت‌گذاری همه پیام‌ها به عنوان خوانده‌شده"""
        now = datetime.now(timezone.utc)
        updated = (
            db.query(PatientMessage)
            .filter(
                PatientMessage.patient_id == patient_id,
                PatientMessage.read_at.is_(None),
            )
            .update({"read_at": now})
        )
        db.commit()
        return updated

    def get_message_by_id(
        self,
        db: Session,
        message_id: uuid.UUID,
        patient_id: uuid.UUID,
    ) -> PatientMessage:
        """دریافت یک پیام با بررسی دسترسی"""
        message = db.query(PatientMessage).filter(
            PatientMessage.id == message_id,
            PatientMessage.patient_id == patient_id,
        ).first()

        if not message:
            raise MessageNotFoundException(
                f"پیام با شناسه {message_id} یافت نشد"
            )

        return message


# Singleton
message_service = MessageService()