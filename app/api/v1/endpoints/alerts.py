"""
Alert Endpoints
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db, require_clinician
from app.models.user import User
from app.schemas.alert import (
    AlertAcknowledgeRequest,
    AlertResolveRequest,
)
from app.services.alert_service import alert_service
from app.shared.enums import AlertCategory, AlertSeverity, AlertStatus
from app.shared.utils import paginate

router = APIRouter(tags=["هشدارها"])


@router.get(
    "/alerts",
    summary="همه هشدارهای فعال — داشبورد کلینیسین",
)
async def list_all_active_alerts(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    severity: Optional[AlertSeverity] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
):
    alerts, total = alert_service.get_all_active_alerts(
        db=db, page=page, size=size, severity=severity
    )
    pagination = paginate(total, page, size)

    stats = alert_service.get_alert_stats(db=db)

    return {
        "success": True,
        "data": [_alert_to_dict(a) for a in alerts],
        "stats": stats,
        **pagination,
    }


@router.get(
    "/patients/{patient_id}/alerts",
    summary="هشدارهای یک بیمار",
)
async def list_patient_alerts(
    patient_id: uuid.UUID,
    status: Optional[AlertStatus] = Query(None),
    severity: Optional[AlertSeverity] = Query(None),
    category: Optional[AlertCategory] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.api.dependencies import verify_patient_access
    verify_patient_access(current_user, patient_id, db)

    alerts, total = alert_service.get_patient_alerts(
        db=db,
        patient_id=patient_id,
        status=status,
        severity=severity,
        category=category,
        page=page,
        size=size,
    )

    pagination = paginate(total, page, size)
    stats = alert_service.get_alert_stats(db=db, patient_id=patient_id)

    return {
        "success": True,
        "data": [_alert_to_dict(a) for a in alerts],
        "stats": stats,
        **pagination,
    }


@router.put(
    "/alerts/{alert_id}/acknowledge",
    summary="تأیید دیده‌شدن هشدار",
)
async def acknowledge_alert(
    request: Request,
    alert_id: uuid.UUID,
    data: AlertAcknowledgeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
):
    alert = alert_service.acknowledge_alert(
        db=db,
        alert_id=alert_id,
        clinician=current_user,
        note=data.note,
        request=request,
    )
    return {
        "success": True,
        "data": _alert_to_dict(alert),
        "message": "هشدار تأیید شد",
    }


@router.put(
    "/alerts/{alert_id}/resolve",
    summary="بستن هشدار",
)
async def resolve_alert(
    request: Request,
    alert_id: uuid.UUID,
    data: AlertResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
):
    alert = alert_service.resolve_alert(
        db=db,
        alert_id=alert_id,
        clinician=current_user,
        resolution_note=data.resolution_note,
        request=request,
    )
    return {
        "success": True,
        "data": _alert_to_dict(alert),
        "message": "هشدار بسته شد",
    }


@router.get(
    "/alerts/stats",
    summary="آمار هشدارها",
)
async def get_alert_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
):
    stats = alert_service.get_alert_stats(db=db)
    return {"success": True, "data": stats}


def _alert_to_dict(alert) -> dict:
    SEVERITY_FA = {"low": "کم", "medium": "متوسط", "high": "زیاد"}
    CATEGORY_FA = {
        "weight": "وزن",
        "blood_pressure": "فشار خون",
        "lab": "آزمایش",
        "symptom": "علائم",
        "fluid": "مایعات",
        "diet": "رژیم غذایی",
    }
    STATUS_FA = {
        "new": "جدید",
        "acknowledged": "دیده‌شده",
        "resolved": "بسته‌شده",
    }

    return {
        "id": str(alert.id),
        "patient_id": str(alert.patient_id),
        "patient_name": (
            alert.patient.full_name
            if hasattr(alert, "patient") and alert.patient
            else None
        ),
        "severity": alert.severity.value,
        "severity_fa": SEVERITY_FA.get(alert.severity.value, ""),
        "category": alert.category.value,
        "category_fa": CATEGORY_FA.get(alert.category.value, ""),
        "title": alert.title,
        "clinician_explanation": alert.clinician_explanation,
        "evidence": alert.evidence,
        "triggered_by_rule": alert.triggered_by_rule,
        "status": alert.status.value,
        "status_fa": STATUS_FA.get(alert.status.value, ""),
        "acknowledged_by": str(alert.acknowledged_by) if alert.acknowledged_by else None,
        "acknowledged_at": alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
        "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None,
        "created_at": alert.created_at.isoformat(),
    }