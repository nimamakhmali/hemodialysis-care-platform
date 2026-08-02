"""
Patients Endpoints
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.deps import (
    get_current_user,
    get_db,
    get_patient_with_access,
    require_clinician,
    require_admin,
)
from app.api.responses import MessageResponse, PaginatedResponse, SuccessResponse
from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import (
    PatientCreateRequest,
    PatientResponse,
    PatientSummaryResponse,
    PatientUpdateRequest,
)
from app.services.patient_service import patient_service
from app.shared.utils import paginate

router = APIRouter(prefix="/patients", tags=["بیماران"])


@router.post(
    "/",
    response_model=SuccessResponse[PatientResponse],
    summary="ثبت بیمار جدید",
)
async def create_patient(
    request: Request,
    data: PatientCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
):
    patient = patient_service.create_patient(
        db=db, data=data, created_by=current_user, request=request
    )
    return {
        "success": True,
        "data": _patient_to_response(patient),
        "message": f"بیمار {patient.full_name} با موفقیت ثبت شد",
    }


@router.get(
    "/",
    summary="لیست بیماران",
)
async def list_patients(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
):
    from app.shared.enums import UserRole
    clinician_id = (
        current_user.id
        if current_user.role == UserRole.CLINICIAN
        else None
    )

    patients, total = patient_service.get_patients_list(
        db=db, page=page, size=size, clinician_id=clinician_id
    )

    pagination = paginate(total, page, size)

    return {
        "success": True,
        "data": [_patient_to_response(p) for p in patients],
        **pagination,
    }


@router.get(
    "/search",
    summary="جستجوی بیمار",
)
async def search_patients(
    q: str = Query(..., min_length=2),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
):
    patients = patient_service.search_patients(db=db, query_str=q, limit=limit)
    return {
        "success": True,
        "data": [_patient_to_response(p) for p in patients],
        "total": len(patients),
    }


@router.get(
    "/{patient_id}",
    response_model=SuccessResponse[PatientResponse],
    summary="جزئیات بیمار",
)
async def get_patient(
    patient: Patient = Depends(get_patient_with_access),
):
    return {
        "success": True,
        "data": _patient_to_response(patient),
    }


@router.put(
    "/{patient_id}",
    response_model=SuccessResponse[PatientResponse],
    summary="ویرایش بیمار",
)
async def update_patient(
    request: Request,
    patient_id: uuid.UUID,
    data: PatientUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
):
    patient = patient_service.update_patient(
        db=db,
        patient_id=patient_id,
        data=data,
        updated_by=current_user,
        request=request,
    )
    return {
        "success": True,
        "data": _patient_to_response(patient),
        "message": "اطلاعات بیمار به‌روزرسانی شد",
    }


@router.delete(
    "/{patient_id}",
    response_model=MessageResponse,
    summary="غیرفعال کردن بیمار",
)
async def deactivate_patient(
    request: Request,
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    patient = patient_service.deactivate_patient(
        db=db,
        patient_id=patient_id,
        deactivated_by=current_user,
        request=request,
    )
    return {
        "success": True,
        "message": f"بیمار {patient.full_name} غیرفعال شد",
    }


@router.get(
    "/{patient_id}/summary",
    summary="خلاصه داشبورد بیمار",
)
async def get_patient_summary(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    patient: Patient = Depends(get_patient_with_access),
):
    summary = patient_service.get_patient_summary(db=db, patient_id=patient_id)

    last_session = summary["last_session"]
    last_panel = summary["last_panel"]

    return {
        "success": True,
        "data": {
            "patient": _patient_to_response(summary["patient"]),
            "alert_counts": summary["alert_counts"],
            "pending_recommendations": summary["pending_recommendations"],
            "last_session": {
                "date": str(last_session.session_date) if last_session else None,
                "pre_weight": last_session.pre_weight if last_session else None,
                "post_weight": last_session.post_weight if last_session else None,
                "weight_gain": last_session.weight_gain if last_session else None,
                "weight_gain_percent": (
                    last_session.weight_gain_percent if last_session else None
                ),
                "bp_pre": (
                    f"{last_session.bp_pre_systolic}/"
                    f"{last_session.bp_pre_diastolic}"
                    if last_session and last_session.has_bp_pre
                    else None
                ),
            } if last_session else None,
            "last_lab_date": (
                str(last_panel.collected_at) if last_panel else None
            ),
        },
    }


def _patient_to_response(patient: Patient) -> dict:
    """تبدیل مدل Patient به dict response"""
    return {
        "id": str(patient.id),
        "medical_record_number": patient.medical_record_number,
        "full_name": patient.full_name,
        "date_of_birth": str(patient.date_of_birth) if patient.date_of_birth else None,
        "gender": patient.gender.value if patient.gender else None,
        "phone_number": patient.phone_number,
        "emergency_contact": patient.emergency_contact,
        "dry_weight": patient.dry_weight,
        "dry_weight_updated_at": (
            patient.dry_weight_updated_at.isoformat()
            if patient.dry_weight_updated_at else None
        ),
        "vascular_access_type": (
            patient.vascular_access_type.value
            if patient.vascular_access_type else None
        ),
        "dialysis_frequency_per_week": patient.dialysis_frequency_per_week,
        "dialysis_start_date": (
            str(patient.dialysis_start_date)
            if patient.dialysis_start_date else None
        ),
        "comorbidities": patient.comorbidities,
        "clinical_notes": patient.clinical_notes,
        "assigned_clinician_id": (
            str(patient.assigned_clinician_id)
            if patient.assigned_clinician_id else None
        ),
        "is_active": patient.is_active,
        "has_app_account": patient.has_app_account,
        "age": patient.age,
    }