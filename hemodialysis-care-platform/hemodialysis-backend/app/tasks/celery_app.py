"""
پیکربندی Celery

Queue ها:
- analysis: تحلیل بالینی (اولویت بالا)
- notification: ارسال پیام‌ها (اولویت معمولی)
- maintenance: کارهای روزانه (اولویت پایین)
"""

from celery import Celery
from celery.schedules import crontab
from kombu import Exchange, Queue

from app.config.settings import get_settings

settings = get_settings()

# ============================================================
# ایجاد اپ Celery
# ============================================================

celery_app = Celery(
    "hemodialysis",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

# ============================================================
# تنظیمات
# ============================================================

celery_app.conf.update(
    # Serialization
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Tehran",
    enable_utc=True,

    # Task Execution
    task_acks_late=True,               # تأیید بعد از اجرا (نه قبل)
    task_reject_on_worker_lost=True,   # retry اگر worker کرش کرد
    worker_prefetch_multiplier=1,      # یک task در یک زمان (برای پزشکی)

    # Retry Policy پیش‌فرض
    task_max_retries=3,
    task_default_retry_delay=60,       # 60 ثانیه بین retry ها

    # Result Backend
    result_expires=3600,               # نتایج ۱ ساعت نگه داشته می‌شوند

    # Queues
    task_queues=(
        Queue(
            "analysis",
            Exchange("analysis"),
            routing_key="analysis",
            queue_arguments={"x-max-priority": 10},
        ),
        Queue(
            "notification",
            Exchange("notification"),
            routing_key="notification",
        ),
        Queue(
            "maintenance",
            Exchange("maintenance"),
            routing_key="maintenance",
        ),
    ),
    task_default_queue="analysis",
    task_default_exchange="analysis",
    task_default_routing_key="analysis",

    # Route های خاص
    task_routes={
        "app.tasks.analysis_tasks.*": {"queue": "analysis"},
        "app.tasks.notification_tasks.*": {"queue": "notification"},
        "app.tasks.maintenance_tasks.*": {"queue": "maintenance"},
    },

    # Beat Schedule — Cron Jobs
    beat_schedule={
        "daily-patient-review": {
            "task": "app.tasks.analysis_tasks.daily_patient_review",
            "schedule": crontab(hour=7, minute=0),  # هر روز ساعت ۷ صبح
            "options": {"queue": "maintenance"},
        },
        "weekly-lab-reminder": {
            "task": "app.tasks.analysis_tasks.check_overdue_labs",
            "schedule": crontab(hour=8, minute=0, day_of_week=0),  # یکشنبه‌ها
            "options": {"queue": "maintenance"},
        },
    },
)

# Auto-discover tasks
celery_app.autodiscover_tasks(
    ["app.tasks.analysis_tasks", "app.tasks.notification_tasks"]
)