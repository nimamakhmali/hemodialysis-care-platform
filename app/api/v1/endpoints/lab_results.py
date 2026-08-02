"""
Lab Results Endpoints
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_patient_with_access, require_clinician
from app.models.patient import Patient
from app.models.user import User
from app.schemas.lab_result import LabPanelCreateRequest
from app.services.lab_service import lab_service
from app.shared.constants import LAB_NAMES_FA, LAB_UNITS
from app.shared.enums import LabTestCode
from app.shared.utils import paginate

router = APIRouter(tags=["آزمایش‌ها"])


@router.post(
    "/patients/{patient_id}/labs",
    summary="ثبت پنل آزمایش",
)
async def create_lab_panel(
    request: Request,
    patient_id: uuid.UUID,
    data: LabPanelCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
    patient: Patient = Depends(get_patient_with_access),
):
    from app.validators.lab_validator import validate_lab_panel
    results_raw = [
        {"test_code": r.test_code, "value": r.value, "unit": r.unit}
        for r in data.results
    ]
    validation = validate_lab_panel(results_raw, db)

    panel = lab_service.create_lab_panel(
        db=db,
        patient_id=patient_id,
        data=data,
        recorded_by=current_user,
        request=request,
    )

    return {
        "success": True,
        "data": _panel_to_dict(panel),
        "cross_check_warnings": validation.cross_check_warnings,
        "message": f"پنل آزمایش با {len(data.results)} نتیجه ثبت شد",
    }


@router.get(
    "/patients/{patient_id}/labs",
    summary="تاریخچه آزمایش‌ها",
)
async def list_lab_panels(
    patient_id: uuid.UUID,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_patient_with_access),
):
    panels, total = lab_service.get_panels(
        db=db, patient_id=patient_id, page=page, size=size
    )
    pagination = paginate(total, page, size)

    return {
        "success": True,
        "data": [_panel_to_dict(p) for p in panels],
        **pagination,
    }


@router.get(
    "/patients/{patient_id}/labs/latest",
    summary="آخرین آزمایش‌ها",
)
async def get_latest_labs(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_patient_with_access),
):
    latest = lab_service.get_latest_results(db=db, patient_id=patient_id)
    return {
        "success": True,
        "data": latest,
        "total": len(latest),
    }


@router.get(
    "/patients/{patient_id}/labs/trend/{test_code}",
    summary="روند یک آزمایش",
)
async def get_lab_trend(
    patient_id: uuid.UUID,
    test_code: str,
    n: int = Query(6, ge=2, le=20),
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_patient_with_access),
):
    valid_codes = {t.value for t in LabTestCode}
    if test_code not in valid_codes:
        return {
            "success": False,
            "error": {"code": "INVALID_TEST_CODE", "message": "کد آزمایش نامعتبر است"},
        }

    trend = lab_service.get_lab_trend(
        db=db, patient_id=patient_id, test_code=test_code, n_results=n
    )
    return {"success": True, "data": trend}


@router.get(
    "/patients/{patient_id}/labs/{panel_id}",
    summary="جزئیات پنل آزمایش",
)
async def get_lab_panel(
    patient_id: uuid.UUID,
    panel_id: uuid.UUID,
    db: Session = Depends(get_db),
    patient: Patient = Depends(get_patient_with_access),
):
    panel = lab_service.get_panel_by_id(db, panel_id, patient_id)
    return {"success": True, "data": _panel_to_dict(panel)}


@router.get(
    "/labs/reference-ranges",
    summary="محدوده‌های مرجع آزمایش‌ها",
)
async def get_reference_ranges(
    db: Session = Depends(get_db),
):
    from app.models.lab_result import LabReferenceRange
    refs = db.query(LabReferenceRange).filter(
        LabReferenceRange.is_active == True
    ).all()

    return {
        "success": True,
        "data": [
            {
                "test_code": r.test_code,
                "name_fa": r.name_fa,
                "unit": r.unit,
                "normal_low": r.normal_low,
                "normal_high": r.normal_high,
                "critical_low": r.critical_low,
                "critical_high": r.critical_high,
                "description": r.description,
            }
            for r in refs
        ],
    }


def _panel_to_dict(panel) -> dict:
    return {
        "id": str(panel.id),
        "patient_id": str(panel.patient_id),
        "collected_at": str(panel.collected_at),
        "reported_at": str(panel.reported_at) if panel.reported_at else None,
        "notes": panel.notes,
        "results": [
            {
                "id": str(r.id),
                "test_code": r.test_code,
                "test_name_fa": LAB_NAMES_FA.get(r.test_code, r.test_code),
                "value": r.value,
                "unit": r.unit,
                "ref_range_low": r.ref_range_low,
                "ref_range_high": r.ref_range_high,
                "is_abnormal": r.is_abnormal,
                "is_critical": r.is_critical,
                "abnormality_direction": r.abnormality_direction,
                "status_fa": r.status_fa,
                "note": r.note,
            }
            for r in panel.results
        ],
        "abnormal_count": len(panel.abnormal_results),
        "critical_count": len(panel.critical_results),
        "created_at": panel.created_at.isoformat(),
    }