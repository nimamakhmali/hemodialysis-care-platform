"""
Message Endpoints — پیام‌های بیمار
"""

import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db, get_patient_with_access
from app.models.patient import Patient
from app.models.user import User
from app.services.message_service import message_service
from app.shared.utils import paginate

router = APIRouter(tags=["پیام‌ها"])


@router.get(
    "/patients/{patient_id}/messages",
    summary="دریافت پیام‌های بیمار",
    description="بیمار پیام‌های تأییدشده توسط پزشک را می‌بیند.",
)
async def list_patient_messages(
    patient_id: uuid.UUID,
    unread_only: bool = Query(False),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    patient: Patient = Depends(get_patient_with_access),
):
    messages, total = message_service.get_patient_messages(
        db=db,
        patient_id=patient_id,
        unread_only=unread_only,
        page=page,
        size=size,
    )

    pagination = paginate(total, page, size)
    unread_count = message_service.get_unread_count(db=db, patient_id=patient_id)

    return {
        "success": True,
        "data": [_message_to_dict(m) for m in messages],
        "unread_count": unread_count,
        **pagination,
    }


@router.put(
    "/messages/{message_id}/read",
    summary="علامت‌گذاری پیام به عنوان خوانده‌شده",
)
async def mark_message_read(
    message_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.api.dependencies import get_patient_id_for_user
    patient_id = get_patient_id_for_user(current_user, db)

    message = message_service.mark_as_read(
        db=db,
        message_id=message_id,
        patient_id=patient_id,
    )
    return {
        "success": True,
        "data": _message_to_dict(message),
        "message": "پیام خوانده‌شده علامت‌گذاری شد",
    }


@router.put(
    "/patients/{patient_id}/messages/read-all",
    summary="خواندن همه پیام‌ها",
)
async def mark_all_read(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    patient: Patient = Depends(get_patient_with_access),
):
    count = message_service.mark_all_as_read(db=db, patient_id=patient_id)
    return {
        "success": True,
        "message": f"{count} پیام خوانده‌شده علامت‌گذاری شد",
    }


@router.get(
    "/patients/{patient_id}/messages/unread-count",
    summary="تعداد پیام‌های خوانده‌نشده",
)
async def get_unread_count(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    patient: Patient = Depends(get_patient_with_access),
):
    count = message_service.get_unread_count(db=db, patient_id=patient_id)
    return {"success": True, "data": {"unread_count": count}}


def _message_to_dict(message) -> dict:
    return {
        "id": str(message.id),
        "patient_id": str(message.patient_id),
        "recommendation_id": (
            str(message.recommendation_id)
            if message.recommendation_id else None
        ),
        "title": message.title,
        "content": message.content,
        "sent_at": message.sent_at.isoformat(),
        "sent_by": str(message.sent_by) if message.sent_by else None,
        "is_read": message.read_at is not None,
        "read_at": message.read_at.isoformat() if message.read_at else None,
    }