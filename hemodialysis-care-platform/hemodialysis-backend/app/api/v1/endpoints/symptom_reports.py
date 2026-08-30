"""
Symptom Reports Endpoints
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    get_db,
    get_patient_with_access,
    require_clinician,
)
from app.models.patient import Patient
from app.models.user import User
from app.schemas.symptom_report import SymptomReportCreateRequest
from app.services.symptom_service import symptom_service
from app.shared.enums import SymptomSeverity, SymptomType, UserRole
from app.shared.utils import paginate

router = APIRouter(tags=["علائم"])


@router.post(
    "/patients/{patient_id}/symptoms",
    summary="ثبت گزارش علائم",
    description=(
        "بیمار یا کلینیسین می‌توانند علائم را ثبت کنند. "
        "علائم خطر (درد سینه، تنگی نفس) بلافاصله هشدار ایجاد می‌کنند."
    ),
)
async def create_symptom_report(
    request: Request,
    patient_id: uuid.UUID,
    data: SymptomReportCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    patient: Patient = Depends(get_patient_with_access),
):
    report = symptom_service.create_symptom_report(
        db=db,
        patient_id=patient_id,
        data=data,
        reported_by=current_user,
        request=request,
    )

    response = {
        "success": True,
        "data": _report_to_dict(report),
        "message": "گزارش علائم ثبت شد",
    }

    # هشدار فوری به کاربر اگر علامت خطر ثبت کرده
    if report.has_danger_symptoms:
        response["urgent_notice"] = (
            "⚠️ علائم خطر ثبت شد. "
            "تیم درمان مطلع شدند. "
            "در صورت وخامت، فوراً با اورژانس تماس بگیرید."
        )

    return response


@router.get(
    "/patients/{patient_id}/symptoms",
    summary="تاریخچه علائم",
)
async def list_symptom_reports(
    patient_id: uuid.UUID,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    days: Optional[int] = Query(None, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    patient: Patient = Depends(get_patient_with_access),
):
    reports, total = symptom_service.get_symptom_history(
        db=db,
        patient_id=patient_id,
        page=page,
        size=size,
        days=days,
    )

    pagination = paginate(total, page, size)

    return {
        "success": True,
        "data": [_report_to_dict(r) for r in reports],
        **pagination,
    }


@router.get(
    "/patients/{patient_id}/symptoms/summary",
    summary="خلاصه فرکانس علائم",
)
async def get_symptom_summary(
    patient_id: uuid.UUID,
    days: int = Query(90, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    patient: Patient = Depends(get_patient_with_access),
):
    summary = symptom_service.get_symptom_frequency(
        db=db,
        patient_id=patient_id,
        days=days,
    )
    return {"success": True, "data": summary}


def _report_to_dict(report) -> dict:
    from app.shared.enums import SymptomType

    SYMPTOM_NAMES_FA = {
        SymptomType.CHEST_PAIN.value: "درد قفسه سینه",
        SymptomType.SHORTNESS_OF_BREATH.value: "تنگی نفس",
        SymptomType.DIZZINESS.value: "سرگیجه",
        SymptomType.ACCESS_SITE_PAIN.value: "درد محل دسترسی عروقی",
        SymptomType.MUSCLE_CRAMP.value: "گرفتگی عضلات",
        SymptomType.NAUSEA.value: "تهوع",
        SymptomType.ITCHING.value: "خارش",
        SymptomType.HEADACHE.value: "سردرد",
        SymptomType.FATIGUE.value: "خستگی",
        SymptomType.SWELLING.value: "ورم",
    }

    SEVERITY_FA = {
        "mild": "خفیف",
        "moderate": "متوسط",
        "severe": "شدید",
    }

    danger_symptoms = []
    from app.services.symptom_service import DANGER_SYMPTOMS, CONCERNING_SYMPTOMS
    for s in (report.symptoms or []):
        stype = s.get("type", "")
        severity = s.get("severity", "")
        try:
            st = SymptomType(stype)
            if st in DANGER_SYMPTOMS:
                danger_symptoms.append(stype)
            elif st in CONCERNING_SYMPTOMS and severity == "severe":
                danger_symptoms.append(stype)
        except ValueError:
            pass

    return {
        "id": str(report.id),
        "patient_id": str(report.patient_id),
        "reported_at": report.reported_at.isoformat(),
        "symptoms": [
            {
                "type": s.get("type"),
                "type_fa": SYMPTOM_NAMES_FA.get(s.get("type", ""), s.get("type", "")),
                "severity": s.get("severity"),
                "severity_fa": SEVERITY_FA.get(s.get("severity", ""), ""),
            }
            for s in (report.symptoms or [])
        ],
        "notes": report.notes,
        "related_session_id": (
            str(report.related_session_id)
            if report.related_session_id else None
        ),
        "has_danger_symptoms": report.has_danger_symptoms,
        "danger_symptoms": danger_symptoms,
        "created_at": report.created_at.isoformat(),
    }