"""
Diet Log Endpoints
"""

import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, get_patient_with_access
from app.models.patient import Patient
from app.models.user import User
from app.schemas.diet_log import DietLogCreateRequest
from app.services.diet_service import diet_service
from app.shared.utils import paginate

router = APIRouter(tags=["رژیم غذایی"])


@router.post(
    "/patients/{patient_id}/diet",
    summary="ثبت رژیم غذایی روزانه",
)
async def log_diet(
    request: Request,
    patient_id: uuid.UUID,
    data: DietLogCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    patient: Patient = Depends(get_patient_with_access),
):
    log = diet_service.log_diet(
        db=db,
        patient_id=patient_id,
        data=data,
        logged_by=current_user,
        request=request,
    )
    return {
        "success": True,
        "data": _log_to_dict(log),
        "message": "رژیم غذایی ثبت شد",
    }


@router.get(
    "/patients/{patient_id}/diet",
    summary="تاریخچه رژیم غذایی",
)
async def list_diet_logs(
    patient_id: uuid.UUID,
    days: int = Query(30, ge=1, le=365),
    page: int = Query(1, ge=1),
    size: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    patient: Patient = Depends(get_patient_with_access),
):
    logs, total = diet_service.get_diet_history(
        db=db,
        patient_id=patient_id,
        days=days,
        page=page,
        size=size,
    )
    pagination = paginate(total, page, size)

    return {
        "success": True,
        "data": [_log_to_dict(log) for log in logs],
        **pagination,
    }


@router.get(
    "/patients/{patient_id}/diet/summary",
    summary="خلاصه رعایت رژیم",
)
async def get_diet_summary(
    patient_id: uuid.UUID,
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    patient: Patient = Depends(get_patient_with_access),
):
    summary = diet_service.get_adherence_summary(
        db=db, patient_id=patient_id, days=days
    )
    return {"success": True, "data": summary}


def _log_to_dict(log) -> dict:
    ADHERENCE_FA = {
        "good": "خوب",
        "moderate": "متوسط",
        "poor": "ضعیف",
    }

    def score_adherence(field: str) -> int:
        val = getattr(log, field).value
        return {"good": 100, "moderate": 60, "poor": 20}.get(val, 0)

    fields = [
        "potassium_adherence",
        "phosphorus_adherence",
        "protein_adherence",
        "sodium_adherence",
    ]
    overall_score = round(
        sum(score_adherence(f) for f in fields) / len(fields)
    )

    return {
        "id": str(log.id),
        "patient_id": str(log.patient_id),
        "log_date": str(log.log_date),
        "potassium_adherence": log.potassium_adherence.value,
        "potassium_adherence_fa": ADHERENCE_FA.get(
            log.potassium_adherence.value, ""
        ),
        "phosphorus_adherence": log.phosphorus_adherence.value,
        "phosphorus_adherence_fa": ADHERENCE_FA.get(
            log.phosphorus_adherence.value, ""
        ),
        "protein_adherence": log.protein_adherence.value,
        "protein_adherence_fa": ADHERENCE_FA.get(
            log.protein_adherence.value, ""
        ),
        "sodium_adherence": log.sodium_adherence.value,
        "sodium_adherence_fa": ADHERENCE_FA.get(
            log.sodium_adherence.value, ""
        ),
        "fluid_binder_taken": log.fluid_binder_taken,
        "notes": log.notes,
        "overall_score": overall_score,
        "created_at": log.created_at.isoformat(),
        "updated_at": log.updated_at.isoformat() if log.updated_at else None,
    }