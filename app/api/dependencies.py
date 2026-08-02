"""
FastAPI Dependencies

این فایل تمام dependency های مشترک API را تعریف می‌کند.
"""

import uuid
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.infrastructure.security.jwt import decode_token
from app.infrastructure.security.rbac import has_permission
from app.models.user import User
from app.models.patient import Patient
from app.services.auth_service import auth_service
from app.shared.enums import UserRole
from app.exceptions.business_exceptions import (
    InsufficientPermissionsException,
    PatientNotFoundException,
    OwnResourceAccessException,
    TokenBlacklistedException,
)

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency اصلی برای دریافت کاربر جاری از توکن JWT

    Raises:
        401: اگر توکن نامعتبر یا منقضی باشد
        401: اگر توکن blacklist شده باشد
        403: اگر کاربر غیرفعال باشد
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "success": False,
            "error": {
                "code": "INVALID_TOKEN",
                "message": "اعتبارسنجی ناموفق بود. لطفاً مجدداً وارد شوید.",
            },
        },
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(credentials.credentials)
    except JWTError:
        raise credentials_exception

    # بررسی blacklist
    if auth_service.is_token_blacklisted(payload.jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code": "TOKEN_BLACKLISTED",
                    "message": "این توکن باطل شده است. لطفاً مجدداً وارد شوید.",
                },
            },
        )

    # بررسی نوع توکن
    if payload.type != "access":
        raise credentials_exception

    user = db.query(User).filter(
        User.id == uuid.UUID(payload.sub)
    ).first()

    if not user:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": {
                    "code": "INACTIVE_USER",
                    "message": "حساب کاربری شما غیرفعال است.",
                },
            },
        )

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """کاربر فعال جاری"""
    return current_user


def require_clinician(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    فقط کلینیسین یا ادمین مجاز است

    Raises:
        403: اگر کاربر بیمار باشد
    """
    if current_user.role == UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": {
                    "code": "CLINICIAN_REQUIRED",
                    "message": "این عملیات فقط برای کادر درمان مجاز است.",
                },
            },
        )
    return current_user


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    فقط ادمین مجاز است

    Raises:
        403: اگر کاربر ادمین نباشد
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": {
                    "code": "ADMIN_REQUIRED",
                    "message": "این عملیات فقط برای مدیر سیستم مجاز است.",
                },
            },
        )
    return current_user


def get_patient_or_404(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> Patient:
    """
    دریافت بیمار یا raise کردن 404

    Raises:
        404: اگر بیمار پیدا نشد
    """
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.is_active == True,
    ).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": {
                    "code": "PATIENT_NOT_FOUND",
                    "message": f"بیمار با شناسه {patient_id} یافت نشد.",
                },
            },
        )

    return patient


def verify_patient_access(
    patient: Patient,
    current_user: User,
) -> bool:
    """
    بررسی اینکه آیا کاربر به این بیمار دسترسی دارد

    - کلینیسین و ادمین به همه بیماران دسترسی دارند
    - بیمار فقط به داده‌های خودش دسترسی دارد

    Raises:
        403: اگر بیمار به داده بیمار دیگری دسترسی بخواهد
    """
    if current_user.role in (UserRole.CLINICIAN, UserRole.ADMIN):
        return True

    if current_user.role == UserRole.PATIENT:
        if patient.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "error": {
                        "code": "ACCESS_DENIED",
                        "message": "شما فقط به اطلاعات خودتان دسترسی دارید.",
                    },
                },
            )

    return True


def get_patient_with_access(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Patient:
    """
    Dependency ترکیبی: دریافت بیمار + بررسی دسترسی
    """
    patient = get_patient_or_404(patient_id, db)
    verify_patient_access(patient, current_user)
    return patient


def require_permission(permission: str):
    """
    Factory برای Dependency بررسی مجوز مشخص

    Usage:
        @router.get("/", dependencies=[Depends(require_permission("patient:read"))])
    """
    def _check_permission(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if not has_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "error": {
                        "code": "INSUFFICIENT_PERMISSIONS",
                        "message": f"شما مجوز '{permission}' را ندارید.",
                    },
                },
            )
        return current_user

    return _check_permission


# ============================================================
# app/api/deps.py — اضافه کردن get_patient_id_for_user
# ============================================================

def get_patient_id_for_user(
    current_user: User,
    db: Session,
) -> uuid.UUID:
    """
    دریافت patient_id برای کاربر با نقش PATIENT

    اگر کاربر نقش PATIENT داشته باشد، patient_id او را برمی‌گرداند.
    اگر clinician باشد، خطا می‌دهد (باید patient_id را explicit وارد کند).
    """
    from app.shared.enums import UserRole
    from app.models.patient import Patient

    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=403,
            detail="این عملیات فقط برای بیماران مجاز است",
        )

    patient = db.query(Patient).filter(
        Patient.user_id == current_user.id,
        Patient.is_active == True,
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="پرونده بیمار برای این کاربر یافت نشد",
        )

    return patient.id