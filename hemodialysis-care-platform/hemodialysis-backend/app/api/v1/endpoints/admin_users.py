"""
Admin Endpoints — مدیریت کاربران سیستم

منطق کاملاً بر پایه مدل واقعی User (app/models/user.py) بنا شده است.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_admin
from app.api.responses import PaginatedResponse
from app.infrastructure.auditing.logger import audit_logger
from app.infrastructure.security.password import (
    hash_password,
    validate_password_strength,
)
from app.models.user import User
from app.schemas.admin import (
    AdminResetPasswordRequest,
    AdminUserCreateRequest,
    AdminUserResponse,
    AdminUserUpdateRequest,
)
from app.shared.enums import UserRole

router = APIRouter(prefix="/admin/users", tags=["ادمین - کاربران"])


def _get_user_or_404(db: Session, user_id: uuid.UUID) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": {"code": "USER_NOT_FOUND", "message": "کاربر یافت نشد."},
            },
        )
    return user


@router.get("/", summary="لیست کاربران")
async def list_users(
    role: UserRole | None = Query(None),
    is_active: bool | None = Query(None),
    search: str | None = Query(None, description="جستجو در نام یا شماره موبایل"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(User)

    if role is not None:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        like = f"%{search.strip()}%"
        query = query.filter(
            or_(User.full_name.ilike(like), User.phone_number.ilike(like))
        )

    total = query.count()
    users = (
        query.order_by(User.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    data = [
        AdminUserResponse.model_validate(u).model_dump(mode="json") for u in users
    ]
    return PaginatedResponse.create(data=data, total=total, page=page, size=size)


@router.post("/", summary="ایجاد کاربر جدید", status_code=status.HTTP_201_CREATED)
async def create_user(
    request: Request,
    payload: AdminUserCreateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    existing = db.query(User).filter(
        User.phone_number == payload.phone_number
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "success": False,
                "error": {
                    "code": "PHONE_ALREADY_EXISTS",
                    "message": "کاربری با این شماره موبایل قبلاً ثبت شده است.",
                },
            },
        )

    is_strong, errors = validate_password_strength(payload.password)
    if not is_strong:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "WEAK_PASSWORD",
                    "message": "رمز عبور کافی قوی نیست.",
                    "details": {"errors": errors},
                },
            },
        )

    user = User(
        phone_number=payload.phone_number,
        full_name=payload.full_name,
        role=payload.role,
        hashed_password=hash_password(payload.password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    audit_logger.log(
        db=db,
        action="CREATE",
        entity_type="User",
        entity_id=str(user.id),
        user_id=admin.id,
        new_values={
            "phone_number": user.phone_number,
            "full_name": user.full_name,
            "role": user.role.value,
        },
        request=request,
    )
    db.commit()

    return {
        "success": True,
        "data": AdminUserResponse.model_validate(user).model_dump(mode="json"),
        "message": "کاربر با موفقیت ایجاد شد",
    }


@router.get("/{user_id}/", summary="جزئیات کاربر")
async def get_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    user = _get_user_or_404(db, user_id)
    return {
        "success": True,
        "data": AdminUserResponse.model_validate(user).model_dump(mode="json"),
    }


@router.put("/{user_id}/", summary="ویرایش کاربر")
async def update_user(
    request: Request,
    user_id: uuid.UUID,
    payload: AdminUserUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = _get_user_or_404(db, user_id)
    old_values = {"full_name": user.full_name, "role": user.role.value}

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.role is not None:
        user.role = payload.role

    db.commit()
    db.refresh(user)

    audit_logger.log(
        db=db,
        action="UPDATE",
        entity_type="User",
        entity_id=str(user.id),
        user_id=admin.id,
        old_values=old_values,
        new_values={"full_name": user.full_name, "role": user.role.value},
        request=request,
    )
    db.commit()

    return {
        "success": True,
        "data": AdminUserResponse.model_validate(user).model_dump(mode="json"),
        "message": "کاربر با موفقیت ویرایش شد",
    }


@router.post("/{user_id}/activate/", summary="فعال‌سازی کاربر")
async def activate_user(
    request: Request,
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = _get_user_or_404(db, user_id)
    user.is_active = True
    db.commit()

    audit_logger.log(
        db=db, action="ACTIVATE", entity_type="User",
        entity_id=str(user.id), user_id=admin.id, request=request,
    )
    db.commit()
    return {"success": True, "message": "کاربر فعال شد"}


@router.post("/{user_id}/deactivate/", summary="غیرفعال‌سازی کاربر")
async def deactivate_user(
    request: Request,
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "CANNOT_DEACTIVATE_SELF",
                    "message": "نمی‌توانید حساب خودتان را غیرفعال کنید.",
                },
            },
        )

    user = _get_user_or_404(db, user_id)
    user.is_active = False
    db.commit()

    audit_logger.log(
        db=db, action="DEACTIVATE", entity_type="User",
        entity_id=str(user.id), user_id=admin.id, request=request,
    )
    db.commit()
    return {"success": True, "message": "کاربر غیرفعال شد"}


@router.post("/{user_id}/reset-password/", summary="بازنشانی رمز عبور کاربر")
async def reset_password(
    request: Request,
    user_id: uuid.UUID,
    payload: AdminResetPasswordRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = _get_user_or_404(db, user_id)

    is_strong, errors = validate_password_strength(payload.new_password)
    if not is_strong:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "WEAK_PASSWORD",
                    "message": "رمز عبور کافی قوی نیست.",
                    "details": {"errors": errors},
                },
            },
        )

    user.hashed_password = hash_password(payload.new_password)
    db.commit()

    audit_logger.log(
        db=db, action="RESET_PASSWORD", entity_type="User",
        entity_id=str(user.id), user_id=admin.id, request=request,
    )
    db.commit()
    return {"success": True, "message": "رمز عبور کاربر بازنشانی شد"}