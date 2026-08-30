# ============================================================
# به‌روزرسانی app/api/v1/router.py — کامل
# ============================================================
"""
Router اصلی API v1 — نسخه نهایی
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    patients,
    dialysis_sessions,
    lab_results,
    symptom_reports,
    fluid_logs,
    diet_logs,
    alerts,
    recommendations,
    messages,
    education,
    dashboard_patient,
    dashboard_clinician,
)

api_router = APIRouter(prefix="/api/v1")

# Auth
api_router.include_router(auth.router)

# بیماران
api_router.include_router(patients.router)

# داده‌های بالینی
api_router.include_router(dialysis_sessions.router)
api_router.include_router(lab_results.router)
api_router.include_router(symptom_reports.router)
api_router.include_router(fluid_logs.router)
api_router.include_router(diet_logs.router)

# هشدار و توصیه
api_router.include_router(alerts.router)
api_router.include_router(recommendations.router)

# پیام‌رسانی و آموزش
api_router.include_router(messages.router)
api_router.include_router(education.router)

# داشبوردها
api_router.include_router(dashboard_patient.router)
api_router.include_router(dashboard_clinician.router)