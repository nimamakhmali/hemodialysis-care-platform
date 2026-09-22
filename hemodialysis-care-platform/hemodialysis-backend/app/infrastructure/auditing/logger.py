"""
Audit Logger متمرکز — نسخه اصلاح‌شده
اصلاح: حذف فیلد changed_fields که در مدل وجود ندارد
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import Request
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class AuditLogger:

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
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> None:
        try:
            from app.models.audit_log import AuditLog

            _ip = ip_address
            _ua = user_agent

            if request:
                _ip = _ip or self._get_client_ip(request)
                _ua = _ua or request.headers.get("user-agent", "")[:500]

            audit = AuditLog(
                user_id=user_id,
                action=action,
                entity_type=entity_type,
                entity_id=str(entity_id),
                old_values=self._sanitize(old_values),
                new_values=self._sanitize(new_values),
                description=description,
                ip_address=_ip,
                user_agent=_ua,
                timestamp=datetime.now(timezone.utc),
            )

            db.add(audit)
            db.flush()

        except Exception as exc:
            logger.error(
                f"Audit logging failed: {exc} "
                f"| action={action} entity={entity_type}/{entity_id}",
                exc_info=True,
            )

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
        success: bool,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        phone_number: Optional[str] = None,
    ) -> None:
        """
        امضای اصلاح‌شده — ip_address و user_agent به صورت keyword argument
        تا با تمام callsiteهای موجود سازگار باشد.
        """
        self.log(
            db=db,
            action="LOGIN_SUCCESS" if success else "LOGIN_FAILED",
            entity_type="User",
            entity_id=str(user_id) if user_id else "unknown",
            user_id=user_id,
            new_values={
                "success": success,
                **({"phone": phone_number} if phone_number else {}),
            },
            description=(
                f"ورود {'موفق' if success else 'ناموفق'}"
                f"{f' از {ip_address}' if ip_address else ''}"
            ),
            ip_address=ip_address,
            user_agent=user_agent,
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
        self.log(
            db=db,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=user_id,
            old_values=old_values,
            new_values=new_values,
            request=request,
        )

    def log_access_denied(
        self,
        db: Session,
        user_id: Optional[uuid.UUID],
        resource: str,
        request: Optional[Request] = None,
    ) -> None:
        self.log(
            db=db,
            action="ACCESS_DENIED",
            entity_type="Security",
            entity_id=resource,
            user_id=user_id,
            description=f"تلاش دسترسی غیرمجاز به {resource}",
            request=request,
        )

    def get_entity_history(
        self,
        db: Session,
        entity_type: str,
        entity_id: str,
        limit: int = 50,
    ) -> list:
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
        from app.models.audit_log import AuditLog
        return (
            db.query(AuditLog)
            .filter(AuditLog.user_id == user_id)
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
            .all()
        )

    def _get_client_ip(self, request: Request) -> Optional[str]:
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        if request.client:
            return request.client.host
        return None

    def _sanitize(self, values: Optional[dict]) -> Optional[dict]:
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
            elif hasattr(val, "isoformat"):
                sanitized[key] = val.isoformat()
            elif hasattr(val, "__str__") and not isinstance(
                val, (str, int, float, bool, type(None), list, dict)
            ):
                sanitized[key] = str(val)
            else:
                sanitized[key] = val

        return sanitized


audit_logger = AuditLogger()