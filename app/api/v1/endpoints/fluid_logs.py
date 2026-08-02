"""
Fluid Log Endpoints
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, get_patient_with_access
from app.models.patient import Patient
from app.models.user import User
from app.schemas.fluid_log import FluidLogCreateRequest
from app.services.fluid_service import fluid_service
from app.shared.utils import paginate

router = APIRouter(tags=["مایعات"])


@router.post(
    "/patients/{patient_id}/fluid",
    summary="ثبت مصرف مایعات روزانه",
)
async def log_fluid(
    request: Request,
    patient_id: uuid.UUID,
    data: FluidLogCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    patient: Patient = Depends(get_patient_with_access),
):
    log = fluid_service.log_fluid_intake(
        db=db,
        patient_id=patient_id,
        data=data,
        logged_by=current_user,
        request=request,
    )

    from app.shared.constants import FLUID_THRESHOLDS
    warnings = []
    if log.total_ml >= FLUID_THRESHOLDS.daily_critical_ml:
        warnings.append(
            f"مصرف مایعات امروز ({log.total_ml} ml) "
            f"بسیار بیشتر از حد توصیه‌شده است"
        )
    elif log.total_ml >= FLUID_THRESHOLDS.daily_warning_ml:
        warnings.append(
            f"مصرف مایعات امروز ({log.total_ml} ml) "
            f"بیشتر از حد توصیه‌شده است"
        )

    return {
        "success": True,
        "data": _log_to_dict(log),
        "warnings": warnings,
        "message": "مصرف مایعات ثبت شد",
    }


@router.get(
    "/patients/{patient_id}/fluid",
    summary="تاریخچه مصرف مایعات",
)
async def list_fluid_logs(
    patient_id: uuid.UUID,
    days: int = Query(30, ge=1, le=365),
    page: int = Query(1, ge=1),
    size: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    patient: Patient = Depends(get_patient_with_access),
):
    logs, total = fluid_service.get_fluid_history(
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


def _log_to_dict(log) -> dict:
    from app.shared.constants import FLUID_THRESHOLDS

    status_fa = "مناسب"
    if log.total_ml >= FLUID_THRESHOLDS.daily_critical_ml:
        status_fa = "خیلی زیاد"
    elif log.total_ml >= FLUID_THRESHOLDS.daily_warning_ml:
        status_fa = "بالاتر از حد توصیه‌شده"

    return {
        "id": str(log.id),
        "patient_id": str(log.patient_id),
        "log_date": str(log.log_date),
        "total_ml": log.total_ml,
        "items": log.items,
        "notes": log.notes,
        "status_fa": status_fa,
        "created_at": log.created_at.isoformat(),
        "updated_at": log.updated_at.isoformat() if log.updated_at else None,
    }