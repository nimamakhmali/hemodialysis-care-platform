"""
Recommendation Endpoints
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db, require_clinician
from app.models.user import User
from app.schemas.alert import (
    RecommendationApproveRequest,
    RecommendationRejectRequest,
)
from app.services.recommendation_service import recommendation_service
from app.shared.enums import AlertSeverity, RecommendationStatus
from app.shared.utils import paginate

router = APIRouter(tags=["توصیه‌ها"])


@router.get(
    "/recommendations/pending",
    summary="توصیه‌های در انتظار بررسی",
)
async def list_pending_recommendations(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    priority: Optional[AlertSeverity] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
):
    recs, total = recommendation_service.get_pending_recommendations(
        db=db, page=page, size=size, priority=priority
    )
    pagination = paginate(total, page, size)

    return {
        "success": True,
        "data": [_rec_to_dict(r) for r in recs],
        "pending_count": total,
        **pagination,
    }


@router.get(
    "/patients/{patient_id}/recommendations",
    summary="تاریخچه توصیه‌های بیمار",
)
async def list_patient_recommendations(
    patient_id: uuid.UUID,
    status: Optional[RecommendationStatus] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.api.dependencies import verify_patient_access
    verify_patient_access(current_user, patient_id, db)

    recs, total = recommendation_service.get_patient_recommendations(
        db=db,
        patient_id=patient_id,
        status=status,
        page=page,
        size=size,
    )
    pagination = paginate(total, page, size)

    return {
        "success": True,
        "data": [_rec_to_dict(r) for r in recs],
        **pagination,
    }


@router.post(
    "/recommendations/{recommendation_id}/approve",
    summary="تأیید توصیه توسط پزشک",
    description=(
        "پزشک می‌تواند متن پیام بیمار را ویرایش کند یا "
        "پیش‌نویس سیستم را تأیید کند. "
        "با تأیید، پیام به بیمار ارسال می‌شود."
    ),
)
async def approve_recommendation(
    request: Request,
    recommendation_id: uuid.UUID,
    data: RecommendationApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
):
    rec = recommendation_service.approve_recommendation(
        db=db,
        recommendation_id=recommendation_id,
        clinician=current_user,
        patient_content=data.patient_content,
        send_as_message=data.send_as_message,
        request=request,
    )
    return {
        "success": True,
        "data": _rec_to_dict(rec),
        "message": "توصیه تأیید شد و پیام به بیمار ارسال گردید"
        if data.send_as_message
        else "توصیه تأیید شد",
    }


@router.post(
    "/recommendations/{recommendation_id}/reject",
    summary="رد توصیه توسط پزشک",
)
async def reject_recommendation(
    request: Request,
    recommendation_id: uuid.UUID,
    data: RecommendationRejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
):
    rec = recommendation_service.reject_recommendation(
        db=db,
        recommendation_id=recommendation_id,
        clinician=current_user,
        reason=data.reason,
        request=request,
    )
    return {
        "success": True,
        "data": _rec_to_dict(rec),
        "message": "توصیه رد شد",
    }


@router.get(
    "/recommendations/pending-count",
    summary="تعداد توصیه‌های در انتظار",
)
async def get_pending_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
):
    count = recommendation_service.get_pending_count(db=db)
    return {"success": True, "data": {"pending_count": count}}


def _rec_to_dict(rec) -> dict:
    PRIORITY_FA = {"low": "کم", "medium": "متوسط", "high": "زیاد"}
    STATUS_FA = {
        "draft": "در انتظار بررسی",
        "approved": "تأییدشده",
        "edited": "ویرایش‌شده",
        "rejected": "ردشده",
    }

    return {
        "id": str(rec.id),
        "patient_id": str(rec.patient_id),
        "patient_name": (
            rec.patient.full_name
            if hasattr(rec, "patient") and rec.patient
            else None
        ),
        "alert_id": str(rec.alert_id) if rec.alert_id else None,
        "draft_for_clinician": rec.draft_for_clinician,
        "patient_content": rec.patient_content,
        "education_topic": rec.education_topic,
        "status": rec.status.value,
        "status_fa": STATUS_FA.get(rec.status.value, ""),
        "priority": rec.priority.value,
        "priority_fa": PRIORITY_FA.get(rec.priority.value, ""),
        "reviewed_by": str(rec.reviewed_by) if rec.reviewed_by else None,
        "reviewed_at": rec.reviewed_at.isoformat() if rec.reviewed_at else None,
        "review_notes": rec.review_notes,
        "created_at": rec.created_at.isoformat(),
        "updated_at": rec.updated_at.isoformat() if rec.updated_at else None,
    }