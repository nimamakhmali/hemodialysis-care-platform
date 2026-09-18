"""
Admin Endpoints — وضعیت سلامت و آمار سیستم

⚠️ به‌دلیل عدم دسترسی به مدل‌های DialysisSession/LabPanel/Alert در این
مرحله، آمار صرفاً بر پایه User و Patient (مدل‌های تأییدشده) محاسبه شده.
برای افزودن آمار جلسات/آزمایش/هشدار، فایل‌های مدل مربوطه لازم است.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_admin
from app.config.settings import get_settings
from app.models.patient import Patient
from app.models.user import User
from app.shared.enums import UserRole

router = APIRouter(prefix="/admin/system", tags=["ادمین - سیستم"])
settings = get_settings()


@router.get("/health/", summary="وضعیت سلامت زیرساخت")
async def system_health(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    redis_status = "ok"
    try:
        import redis
        client = redis.from_url(settings.REDIS_URL, socket_connect_timeout=2)
        client.ping()
    except Exception:
        redis_status = "error"

    celery_status = "unknown"
    try:
        from app.tasks.celery_app import celery_app
        inspection = celery_app.control.inspect(timeout=2)
        pong = inspection.ping()
        celery_status = "ok" if pong else "error"
    except Exception:
        celery_status = "error"

    return {
        "success": True,
        "data": {
            "database": db_status,
            "redis": redis_status,
            "celery": celery_status,
        },
    }


@router.get("/stats/", summary="آمار کلی سیستم")
async def system_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    total_users = db.query(User).count()
    users_by_role = {
        role.value: db.query(User).filter(User.role == role).count()
        for role in UserRole
    }

    total_patients = db.query(Patient).count()
    active_patients = db.query(Patient).filter(
        Patient.is_active == True  # noqa: E712
    ).count()
    inactive_patients = total_patients - active_patients

    return {
        "success": True,
        "data": {
            "total_users": total_users,
            "users_by_role": users_by_role,
            "total_patients": total_patients,
            "active_patients": active_patients,
            "inactive_patients": inactive_patients,
        },
    }