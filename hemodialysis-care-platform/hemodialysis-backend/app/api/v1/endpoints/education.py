"""
Education Endpoints — محتوای آموزشی
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, get_db, get_patient_with_access, require_admin
from app.models.patient import Patient
from app.models.user import User
from app.services.education_service import education_service
from app.shared.utils import paginate

router = APIRouter(tags=["آموزش"])


class EducationCreateRequest(BaseModel):
    topic_code: str
    title_fa: str
    content_fa: str
    tags: Optional[List[str]] = None
    trigger_conditions: Optional[dict] = None

    @field_validator("topic_code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        v = v.strip().upper()
        if not v or len(v) < 2:
            raise ValueError("کد موضوع معتبر نیست")
        return v

    @field_validator("content_fa")
    @classmethod
    def validate_content(cls, v: str) -> str:
        if len(v.strip()) < 20:
            raise ValueError("محتوای آموزشی خیلی کوتاه است")
        return v


class EducationUpdateRequest(BaseModel):
    title_fa: Optional[str] = None
    content_fa: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None


@router.get(
    "/education",
    summary="همه محتوای آموزشی",
)
async def list_education(
    active_only: bool = Query(True),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contents, total = education_service.get_all_content(
        db=db, active_only=active_only, page=page, size=size
    )
    pagination = paginate(total, page, size)

    return {
        "success": True,
        "data": [_content_to_dict(c) for c in contents],
        **pagination,
    }


@router.get(
    "/education/search",
    summary="جستجو در محتوای آموزشی",
)
async def search_education(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = education_service.search_education(db=db, query_str=q)
    return {
        "success": True,
        "data": [_content_to_dict(c) for c in results],
        "total": len(results),
    }


@router.get(
    "/education/{topic_code}",
    summary="یک محتوای آموزشی",
)
async def get_education_content(
    topic_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = education_service.get_content_by_topic(
        db=db, topic_code=topic_code.upper()
    )

    if not content:
        return {
            "success": False,
            "error": {
                "code": "NOT_FOUND",
                "message": f"محتوای آموزشی '{topic_code}' یافت نشد",
            },
        }

    return {"success": True, "data": _content_to_dict(content)}


@router.get(
    "/patients/{patient_id}/education/relevant",
    summary="محتوای آموزشی مرتبط با بیمار",
    description=(
        "بر اساس هشدارهای فعال و آزمایش‌های اخیر، "
        "محتوای آموزشی شخصی‌سازی‌شده نمایش داده می‌شود."
    ),
)
async def get_relevant_education(
    patient_id: uuid.UUID,
    max_items: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    patient: Patient = Depends(get_patient_with_access),
):
    contents = education_service.get_relevant_content(
        db=db,
        patient_id=patient_id,
        max_items=max_items,
    )

    return {
        "success": True,
        "data": [_content_to_dict(c) for c in contents],
        "total": len(contents),
        "personalized": True,
    }


@router.post(
    "/education",
    summary="ایجاد محتوای آموزشی (فقط ادمین)",
)
async def create_education_content(
    request: Request,
    data: EducationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    content = education_service.create_content(
        db=db,
        topic_code=data.topic_code,
        title_fa=data.title_fa,
        content_fa=data.content_fa,
        tags=data.tags,
        trigger_conditions=data.trigger_conditions,
        created_by=current_user.id,
    )
    return {
        "success": True,
        "data": _content_to_dict(content),
        "message": "محتوای آموزشی ایجاد شد",
    }


@router.put(
    "/education/{content_id}",
    summary="ویرایش محتوای آموزشی (فقط ادمین)",
)
async def update_education_content(
    content_id: uuid.UUID,
    data: EducationUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    content = education_service.update_content(
        db=db,
        content_id=content_id,
        title_fa=data.title_fa,
        content_fa=data.content_fa,
        tags=data.tags,
        is_active=data.is_active,
    )
    return {
        "success": True,
        "data": _content_to_dict(content),
        "message": "محتوای آموزشی به‌روزرسانی شد",
    }


def _content_to_dict(content) -> dict:
    return {
        "id": str(content.id),
        "topic_code": content.topic_code,
        "title_fa": content.title_fa,
        "content_fa": content.content_fa,
        "tags": content.tags or [],
        "trigger_conditions": content.trigger_conditions or {},
        "is_active": content.is_active,
        "created_at": content.created_at.isoformat(),
        "updated_at": (
            content.updated_at.isoformat() if content.updated_at else None
        ),
    }