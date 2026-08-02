
"""
Router اصلی API v1 — به‌روزرسانی با endpoints جدید
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
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(patients.router)
api_router.include_router(dialysis_sessions.router)
api_router.include_router(lab_results.router)
api_router.include_router(symptom_reports.router)
api_router.include_router(fluid_logs.router)
api_router.include_router(diet_logs.router)