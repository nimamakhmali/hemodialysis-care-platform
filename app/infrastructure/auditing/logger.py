"""
سیستم Audit Logging

ثبت تمام تغییرات مهم سیستم برای حسابرسی و ردیابی
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


class AuditLogger:
    """
    سرویس ثبت رویدادهای حسابرسی

    این کلاس به صورت singleton استفاده می‌شود.
    تمام عملیات مهم سیستم از طریق این کلاس لاگ می‌شوند.
    جدول audit_logs هرگز UPDATE یا DELETE نمی‌شود.
    """

    def log(
        self,
        db: Session,
        action: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        user_id: Optional[uuid.UUID] = None,
        old_values: Optional[dict] = None,
        new_values: Optional[dict] = None,
        description: Optional[str] = None,
        request: Optional[Request] = None,
    ) -> AuditLog:
        """
        ثبت یک رویداد در لاگ حسابرسی

        Args:
            db: session دیتابیس
            action: نوع عملیات (CREATE, UPDATE, DELETE, LOGIN, ...)
            entity_type: نام موجودیت (Patient, LabResult, ...)
            entity_id: شناسه موجودیت
            user_id: شناسه کاربر انجام‌دهنده (None = سیستم)
            old_values: مقادیر قبل از تغییر
            new_values: مقادیر بعد از تغییر
            description: توضیح اضافه
            request: درخواست HTTP (برای IP و user_agent)

        Returns:
            رکورد AuditLog ایجادشده
        """
        ip_address = None
        user_agent = None

        if request:
            # استخراج IP واقعی (در صورت وجود proxy)
            forwarded_for = request.headers.get("X-Forwarded-For")
            if forwarded_for:
                ip_address = forwarded_for.split(",")[0].strip()
            else:
                ip_address = (
                    request.client.host if request.client else None
                )
            user_agent = request.headers.get("User-Agent", "")[:500]

        # محاسبه diff برای UPDATE
        if action == "UPDATE" and old_values and new_values:
            changed_fields = {
                k: {"from": old_values.get(k), "to": v}
                for k, v in new_values.items()
                if old_values.get(k) != v
            }
            if changed_fields:
                new_values = {"changed_fields": changed_fields}

        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
            description=description,
        )

        db.add(audit_log)
        db.flush()  # ذخیره بدون commit (commit با transaction اصلی)

        return audit_log

    def log_login(
        self,
        db: Session,
        user_id: uuid.UUID,
        success: bool,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """ثبت رویداد ورود به سیستم"""
        return self.log(
            db=db,
            action="LOGIN_SUCCESS" if success else "LOGIN_FAILED",
            entity_type="User",
            entity_id=str(user_id),
            user_id=user_id if success else None,
            description=f"ورود {'موفق' if success else 'ناموفق'} به سیستم",
        )

    def log_logout(
        self,
        db: Session,
        user_id: uuid.UUID,
    ) -> AuditLog:
        """ثبت رویداد خروج از سیستم"""
        return self.log(
            db=db,
            action="LOGOUT",
            entity_type="User",
            entity_id=str(user_id),
            user_id=user_id,
        )

    def log_create(
        self,
        db: Session,
        user_id: uuid.UUID,
        entity_type: str,
        entity_id: str,
        new_values: Optional[dict] = None,
        request: Optional[Request] = None,
    ) -> AuditLog:
        """ثبت رویداد ایجاد موجودیت"""
        return self.log(
            db=db,
            action="CREATE",
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=user_id,
            new_values=new_values,
            request=request,
        )

    def log_update(
        self,
        db: Session,
        user_id: uuid.UUID,
        entity_type: str,
        entity_id: str,
        old_values: dict,
        new_values: dict,
        request: Optional[Request] = None,
    ) -> AuditLog:
        """ثبت رویداد ویرایش موجودیت"""
        return self.log(
            db=db,
            action="UPDATE",
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=user_id,
            old_values=old_values,
            new_values=new_values,
            request=request,
        )

    def log_approval(
        self,
        db: Session,
        user_id: uuid.UUID,
        entity_type: str,
        entity_id: str,
        action: str,
        notes: Optional[str] = None,
        request: Optional[Request] = None,
    ) -> AuditLog:
        """ثبت رویداد تأیید/رد توسط پزشک"""
        return self.log(
            db=db,
            action=action,  # APPROVE, REJECT, ACKNOWLEDGE, RESOLVE
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=user_id,
            description=notes,
            request=request,
        )


# Singleton instance
audit_logger = AuditLogger()