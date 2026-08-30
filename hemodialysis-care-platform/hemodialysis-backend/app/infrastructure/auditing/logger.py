# ============================================================
# app/infrastructure/auditing/logger.py
# ============================================================
"""
Audit Logger متمرکز

اصول:
- همه تغییرات مهم ثبت می‌شوند
- هرگز UPDATE یا DELETE روی audit_logs انجام نمی‌شود
- diff خودکار محاسبه می‌شود
- IP و user agent از request خودکار گرفته می‌شود
- خطاهای logging نباید main flow را متوقف کنند
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import Request
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class AuditLogger:
    """
    سرویس ثبت تغییرات

    این کلاس singleton است و در همه جای کد
    از طریق audit_logger استفاده می‌شود.
    """

    # ============================================================
    # Core Log Method
    # ============================================================

    def log(
        self,
        db: Session,
        action: str,
        entity_type: str,
        entity_id: str,
        user_id: Optional[uuid.UUID] = None,
        old_values: Optional[dict[str, Any]] = None,
        new_values: Optional[dict[str, Any]] = None,
        description: Optional[str] = None,
        request: Optional[Request] = None,
    ) -> None:
        """
        ثبت یک رویداد در audit log

        Args:
            db: session دیتابیس
            action: نوع عملیات (CREATE, UPDATE, DELETE, LOGIN, ...)
            entity_type: نوع موجودیت (Patient, Alert, ...)
            entity_id: شناسه موجودیت
            user_id: کاربر انجام‌دهنده (None برای سیستم)
            old_values: مقادیر قبلی (برای UPDATE)
            new_values: مقادیر جدید
            description: توضیح اضافی فارسی
            request: FastAPI request برای IP و user agent
        """
        try:
            from app.models.audit_log import AuditLog

            ip_address = None
            user_agent = None

            if request:
                ip_address = self._get_client_ip(request)
                user_agent = request.headers.get("user-agent", "")[:500]

            # محاسبه diff
            changed_fields = None
            if old_values and new_values:
                changed_fields = self._compute_diff(old_values, new_values)

            audit = AuditLog(
                user_id=user_id,
                action=action,
                entity_type=entity_type,
                entity_id=str(entity_id),
                old_values=self._sanitize(old_values),
                new_values=self._sanitize(new_values),
                changed_fields=changed_fields,
                description=description,
                ip_address=ip_address,
                user_agent=user_agent,
                timestamp=datetime.now(timezone.utc),
            )

            db.add(audit)
            # flush بدون commit — commit در main transaction انجام می‌شود
            db.flush()

        except Exception as exc:
            # خطای logging نباید main flow را خراب کند
            logger.error(
                f"Audit logging failed: {exc} "
                f"| action={action} entity={entity_type}/{entity_id}",
                exc_info=True,
            )

    # ============================================================
    # Convenience Methods
    # ============================================================

    def log_create(
        self,
        db: Session,
        user_id: uuid.UUID,
        entity_type: str,
        entity_id: str,
        new_values: Optional[dict] = None,
        request: Optional[Request] = None,
    ) -> None:
        self.log(
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
    ) -> None:
        self.log(
            db=db,
            action="UPDATE",
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=user_id,
            old_values=old_values,
            new_values=new_values,
            request=request,
        )

    def log_delete(
        self,
        db: Session,
        user_id: uuid.UUID,
        entity_type: str,
        entity_id: str,
        old_values: Optional[dict] = None,
        request: Optional[Request] = None,
    ) -> None:
        self.log(
            db=db,
            action="DELETE",
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=user_id,
            old_values=old_values,
            request=request,
        )

    def log_login(
        self,
        db: Session,
        user_id: Optional[uuid.UUID],
        ip: Optional[str],
        success: bool,
        phone_number: Optional[str] = None,
    ) -> None:
        self.log(
            db=db,
            action="LOGIN_SUCCESS" if success else "LOGIN_FAILED",
            entity_type="User",
            entity_id=str(user_id) if user_id else "unknown",
            user_id=user_id,
            new_values={
                "success": success,
                "phone": phone_number,
                "ip": ip,
            },
            description=(
                f"ورود {'موفق' if success else 'ناموفق'}"
                f"{f' از {ip}' if ip else ''}"
            ),
        )

    def log_logout(
        self,
        db: Session,
        user_id: uuid.UUID,
        request: Optional[Request] = None,
    ) -> None:
        self.log(
            db=db,
            action="LOGOUT",
            entity_type="User",
            entity_id=str(user_id),
            user_id=user_id,
            request=request,
        )

    def log_approval(
        self,
        db: Session,
        user_id: uuid.UUID,
        entity_type: str,
        entity_id: str,
        action: str,
        old_values: Optional[dict] = None,
        new_values: Optional[dict] = None,
        request: Optional[Request] = None,
    ) -> None:
        """ثبت تأیید/رد توصیه یا سایر approval flows"""
        self.log(
            db=db,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=user_id,
            old_values=old_values,
            new_values=new_values,
            description=f"عملیات {action} توسط کاربر {user_id}",
            request=request,
        )

    def log_access_denied(
        self,
        db: Session,
        user_id: Optional[uuid.UUID],
        resource: str,
        request: Optional[Request] = None,
    ) -> None:
        """ثبت تلاش دسترسی غیرمجاز"""
        self.log(
            db=db,
            action="ACCESS_DENIED",
            entity_type="Security",
            entity_id=resource,
            user_id=user_id,
            description=f"تلاش دسترسی غیرمجاز به {resource}",
            request=request,
        )

    # ============================================================
    # Query Methods (برای admin panel)
    # ============================================================

    def get_entity_history(
        self,
        db: Session,
        entity_type: str,
        entity_id: str,
        limit: int = 50,
    ) -> list:
        """تاریخچه تغییرات یک موجودیت"""
        from app.models.audit_log import AuditLog

        return (
            db.query(AuditLog)
            .filter(
                AuditLog.entity_type == entity_type,
                AuditLog.entity_id == entity_id,
            )
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
            .all()
        )

    def get_user_activity(
        self,
        db: Session,
        user_id: uuid.UUID,
        limit: int = 100,
    ) -> list:
        """فعالیت‌های اخیر یک کاربر"""
        from app.models.audit_log import AuditLog

        return (
            db.query(AuditLog)
            .filter(AuditLog.user_id == user_id)
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
            .all()
        )

    # ============================================================
    # Private Helpers
    # ============================================================

    def _get_client_ip(self, request: Request) -> Optional[str]:
        """دریافت IP واقعی (با در نظر گرفتن proxy)"""
        # X-Forwarded-For برای reverse proxy
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        if request.client:
            return request.client.host

        return None

    def _compute_diff(
        self,
        old: dict[str, Any],
        new: dict[str, Any],
    ) -> Optional[list[str]]:
        """محاسبه فیلدهایی که تغییر کرده‌اند"""
        if not old or not new:
            return None

        changed = []
        all_keys = set(old.keys()) | set(new.keys())

        for key in all_keys:
            old_val = old.get(key)
            new_val = new.get(key)
            if old_val != new_val:
                changed.append(key)

        return changed if changed else None

    def _sanitize(self, values: Optional[dict]) -> Optional[dict]:
        """
        حذف اطلاعات حساس از لاگ

        رمز عبور و token هرگز در لاگ ذخیره نمی‌شوند.
        """
        if not values:
            return values

        SENSITIVE_FIELDS = {
            "password", "hashed_password", "token",
            "access_token", "refresh_token", "secret",
        }

        sanitized = {}
        for key, val in values.items():
            if key.lower() in SENSITIVE_FIELDS:
                sanitized[key] = "***"
            else:
                # تبدیل UUID و datetime به string برای JSON
                if hasattr(val, "isoformat"):
                    sanitized[key] = val.isoformat()
                elif hasattr(val, "__str__") and not isinstance(
                    val, (str, int, float, bool, type(None), list, dict)
                ):
                    sanitized[key] = str(val)
                else:
                    sanitized[key] = val

        return sanitized


# Singleton
audit_logger = AuditLogger()