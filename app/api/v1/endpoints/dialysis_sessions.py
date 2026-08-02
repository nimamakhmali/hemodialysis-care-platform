"""
Dialysis Session Endpoints
"""

import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_patient_with_access, require_clinician
from app.api.responses import SuccessResponse
from app.models.patient import Patient
from app.models.user import User
from app.schemas.dialysis_session import (
    DialysisSessionCreateRequest,
    DialysisSessionUpdateRequest,
)
from app.services.dialysis_service import dialysis_service
from app.shared.utils import paginate

router = APIRouter(tags=["جلسات دیالیز"])


@router.post(
    "/patients/{patient_id}/sessions",
    summary="ثبت جلسه دیالیز",
)
async def create_session(
    request: Request,
    patient_id: uuid.UUID,
    data: DialysisSessionCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
    patient: Patient = Depends(get_patient_with_access),
):
    session = dialysis_service.create_session(
        db=db,
        patient_id=patient_id,
        data=data,
        recorded_by=current_user,
        request=request,
    )

    warnings = []
    # برگرداندن هشدارهای validation به client
    w_result = __import__(
        "app.validators.dialysis_validator",
        fromlist=["validate_session_weights"],
    ).validate_session_weights(
        pre_weight=data.pre_weight,
        dry_weight=patient.dry_weight,
        post_weight=data.post_weight,
        duration_minutes=data.duration_minutes,
    )
    warnings.extend(w_result.warnings)

    return {
        "success": True,
        "data": _session_to_dict(session),
        "warnings": warnings,
        "message": "جلسه دیالیز با موفقیت ثبت شد",
    }


@router.get(
    "/patients/{patient_id}/sessions",
    summary="لیست جلسات دیالیز",
)
async def list_sessions(
    patient_id: uuid.UUID,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_patient_with_access),
):
    sessions, total = dialysis_service.get_sessions(
        db=db,
        patient_id=patient_id,
        page=page,
        size=size,
        from_date=from_date,
        to_date=to_date,
    )

    pagination = paginate(total, page, size)

    return {
        "success": True,
        "data": [_session_to_dict(s) for s in sessions],
        **pagination,
    }


@router.get(
    "/patients/{patient_id}/sessions/weight-trend",
    summary="روند وزن بیمار",
)
async def get_weight_trend(
    patient_id: uuid.UUID,
    n: int = Query(8, ge=3, le=20),
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_patient_with_access),
):
    trend = dialysis_service.get_weight_trend(
        db=db, patient_id=patient_id, n_sessions=n
    )
    return {"success": True, "data": trend}


@router.get(
    "/patients/{patient_id}/sessions/bp-trend",
    summary="روند فشار خون",
)
async def get_bp_trend(
    patient_id: uuid.UUID,
    n: int = Query(8, ge=3, le=20),
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_patient_with_access),
):
    trend = dialysis_service.get_bp_trend(
        db=db, patient_id=patient_id, n_sessions=n
    )
    return {"success": True, "data": trend}


@router.get(
    "/patients/{patient_id}/sessions/{session_id}",
    summary="جزئیات جلسه",
)
async def get_session(
    patient_id: uuid.UUID,
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_patient_with_access),
):
    session = dialysis_service.get_session_by_id(db, session_id, patient_id)
    return {"success": True, "data": _session_to_dict(session)}


@router.put(
    "/patients/{patient_id}/sessions/{session_id}",
    summary="ویرایش جلسه",
)
async def update_session(
    request: Request,
    patient_id: uuid.UUID,
    session_id: uuid.UUID,
    data: DialysisSessionUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
    patient: Patient = Depends(get_patient_with_access),
):
    session = dialysis_service.update_session(
        db=db,
        session_id=session_id,
        patient_id=patient_id,
        data=data,
        updated_by=current_user,
        request=request,
    )
    return {
        "success": True,
        "data": _session_to_dict(session),
        "message": "جلسه دیالیز به‌روزرسانی شد",
    }


def _session_to_dict(session) -> dict:
    return {
        "id": str(session.id),
        "patient_id": str(session.patient_id),
        "session_date": str(session.session_date),
        "session_start_time": str(session.session_start_time) if session.session_start_time else None,
        "duration_minutes": session.duration_minutes,
        "pre_weight": session.pre_weight,
        "post_weight": session.post_weight,
        "dry_weight_at_session": session.dry_weight_at_session,
        "weight_gain": session.weight_gain,
        "weight_gain_percent": session.weight_gain_percent,
        "uf_volume": session.uf_volume,
        "bp_pre_systolic": session.bp_pre_systolic,
        "bp_pre_diastolic": session.bp_pre_diastolic,
        "bp_during_systolic": session.bp_during_systolic,
        "bp_during_diastolic": session.bp_during_diastolic,
        "bp_post_systolic": session.bp_post_systolic,
        "bp_post_diastolic": session.bp_post_diastolic,
        "bp_drop_during": session.bp_drop_during,
        "intradialytic_events": session.intradialytic_events,
        "notes": session.notes,
        "had_intradialytic_hypotension": session.had_intradialytic_hypotension,
        "created_at": session.created_at.isoformat(),
    }