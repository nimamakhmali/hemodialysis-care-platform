"""
Admin Endpoints — لاگ‌های سیستم (Audit Log)

⚠️ این پیاده‌سازی بر پایه ساختار مورد انتظار AuditLog است که در سراسر
سیستم (auth_service.py، auth.py) به‌صورت مکرر با این امضا صدا زده می‌شود:
    audit_logger.log(db, action, entity_type, entity_id, user_id,
                      old_values, new_values, request)
اگر نام فیلدهای واقعی مدل متفاوت است، app/models/audit_log.py را
برای اصلاح دقیق ارسال کنید.
"""

import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_admin
from app.api.responses import PaginatedResponse
from app.models.audit_log import AuditLog
from app.models.user import User

router = APIRouter(prefix="/admin/audit-logs", tags=["ادمین - لاگ‌ها"])


@router.get("/", summary="لیست لاگ‌های سیستم")
async def list_audit_logs(
    user_id: str | None = Query(None),
    entity_type: str | None = Query(None),
    action: str | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(AuditLog)

    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if action:
        query = query.filter(AuditLog.action == action)
    if date_from:
        query = query.filter(AuditLog.timestamp >= date_from)
    if date_to:
        query = query.filter(AuditLog.timestamp <= date_to)

    total = query.count()
    logs = (
        query.order_by(AuditLog.timestamp.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    user_ids = {log.user_id for log in logs if log.user_id}
    users_map = {}
    if user_ids:
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        users_map = {u.id: u.full_name for u in users}

    data = [
        {
            "id": str(log.id),
            "user_id": str(log.user_id) if log.user_id else None,
            "user_name": users_map.get(log.user_id, "سیستم"),
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "old_values": log.old_values,
            "new_values": log.new_values,
            "ip_address": log.ip_address,
            "timestamp": log.timestamp.isoformat(),
        }
        for log in logs
    ]

    return PaginatedResponse.create(data=data, total=total, page=page, size=size)


@router.get("/export/", summary="خروجی CSV لاگ‌ها")
async def export_audit_logs(
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(AuditLog)
    if date_from:
        query = query.filter(AuditLog.timestamp >= date_from)
    if date_to:
        query = query.filter(AuditLog.timestamp <= date_to)

    logs = query.order_by(AuditLog.timestamp.desc()).limit(5000).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["زمان", "کاربر", "عملیات", "نوع موجودیت", "شناسه موجودیت", "IP"])
    for log in logs:
        writer.writerow([
            log.timestamp.isoformat(),
            str(log.user_id) if log.user_id else "سیستم",
            log.action,
            log.entity_type,
            log.entity_id,
            log.ip_address or "-",
        ])

    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_logs.csv"},
    )