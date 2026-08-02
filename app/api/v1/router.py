"""
Router اصلی API v1
"""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, patients, dialysis_sessions, lab_results

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(patients.router)
api_router.include_router(dialysis_sessions.router)
api_router.include_router(lab_results.router)