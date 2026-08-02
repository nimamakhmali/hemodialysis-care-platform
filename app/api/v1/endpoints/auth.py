"""
Auth Endpoints — احراز هویت و مدیریت توکن
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.api.responses import MessageResponse, SuccessResponse
from app.infrastructure.auditing.logger import audit_logger
from app.models.user import User
from app.schemas.auth import (
    AccessTokenResponse,
    ChangePasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    TokenResponse,
)
from app.services.auth_service import auth_service
from app.shared.enums import UserRole

router = APIRouter(prefix="/auth", tags=["احراز هویت"])


@router.post(
    "/login",
    response_model=SuccessResponse[TokenResponse],
    summary="ورود به سیستم",
    description="ورود با شماره موبایل و رمز عبور و دریافت توکن JWT",
)
async def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    ورود به سیستم

    - Rate limit: حداکثر ۵ تلاش ناموفق در ۱۰ دقیقه
    - در صورت موفقیت: access_token + refresh_token
    - Audit log ثبت می‌شود
    """
    # بررسی rate limit
    is_allowed, remaining_or_ttl = auth_service.check_rate_limit(
        login_data.phone_number
    )

    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "success": False,
                "error": {
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": (
                        f"تعداد تلاش‌های ناموفق بیش از حد مجاز است. "
                        f"لطفاً {remaining_or_ttl} ثانیه صبر کنید."
                    ),
                },
            },
        )

    try:
        user = auth_service.authenticate_user(
            db=db,
            phone_number=login_data.phone_number,
            password=login_data.password,
        )
    except Exception as e:
        # افزایش شمارنده تلاش‌های ناموفق
        auth_service.increment_login_attempts(login_data.phone_number)

        # Audit log ورود ناموفق
        audit_logger.log_login(
            db=db,
            user_id=None,
            success=False,
        )
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": str(e),
                },
            },
        )

    # ورود موفق — reset rate limit
    auth_service.reset_login_attempts(login_data.phone_number)

    # ایجاد توکن‌ها
    token_pair = auth_service.create_tokens(user)

    # Audit log ورود موفق
    audit_logger.log_login(
        db=db,
        user_id=user.id,
        success=True,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("User-Agent", "")[:500],
    )
    db.commit()

    return {
        "success": True,
        "data": {
            "access_token": token_pair.access_token,
            "refresh_token": token_pair.refresh_token,
            "token_type": token_pair.token_type,
            "expires_in": token_pair.expires_in,
            "user": {
                "id": str(user.id),
                "full_name": user.full_name,
                "phone_number": user.phone_number,
                "role": user.role,
            },
        },
        "message": f"خوش آمدید، {user.full_name}",
    }


@router.post(
    "/refresh",
    response_model=SuccessResponse[AccessTokenResponse],
    summary="تجدید توکن",
    description="دریافت access token جدید با refresh token",
)
async def refresh_token(
    refresh_data: RefreshRequest,
    db: Session = Depends(get_db),
):
    """
    تجدید Access Token

    - Refresh token معتبر لازم است
    - Refresh token نباید blacklist شده باشد
    """
    try:
        access_token, expires_in = auth_service.refresh_access_token(
            refresh_data.refresh_token
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code": "INVALID_REFRESH_TOKEN",
                    "message": str(e),
                },
            },
        )

    return {
        "success": True,
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": expires_in,
        },
        "message": "توکن با موفقیت تجدید شد",
    }


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="خروج از سیستم",
    description="باطل کردن توکن‌ها و خروج از سیستم",
)
async def logout(
    request: Request,
    logout_data: LogoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    خروج از سیستم

    - Access token فعلی blacklist می‌شود
    - Refresh token (در صورت ارسال) هم blacklist می‌شود
    - Audit log ثبت می‌شود
    """
    # استخراج access token از header
    auth_header = request.headers.get("Authorization", "")
    access_token = auth_header.replace("Bearer ", "").replace("bearer ", "")

    auth_service.invalidate_tokens(
        access_token=access_token,
        refresh_token=logout_data.refresh_token,
    )

    # Audit log
    audit_logger.log_logout(db=db, user_id=current_user.id)
    db.commit()

    return {
        "success": True,
        "message": "با موفقیت از سیستم خارج شدید",
    }


@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="تغییر رمز عبور",
    description="تغییر رمز عبور با رمز قدیمی",
)
async def change_password(
    request: Request,
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    تغییر رمز عبور

    - رمز قدیمی لازم است
    - رمز جدید باید قوانین امنیتی را داشته باشد
    - Audit log ثبت می‌شود
    """
    try:
        auth_service.change_password(
            db=db,
            user=current_user,
            old_password=password_data.old_password,
            new_password=password_data.new_password,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "PASSWORD_CHANGE_FAILED",
                    "message": str(e),
                },
            },
        )

    # Audit log
    audit_logger.log(
        db=db,
        action="CHANGE_PASSWORD",
        entity_type="User",
        entity_id=str(current_user.id),
        user_id=current_user.id,
        request=request,
    )
    db.commit()

    return {
        "success": True,
        "message": "رمز عبور با موفقیت تغییر کرد",
    }


@router.get(
    "/me",
    summary="اطلاعات کاربر جاری",
    description="دریافت اطلاعات کاربر لاگین‌شده",
)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    """دریافت اطلاعات کاربر جاری"""
    return {
        "success": True,
        "data": {
            "id": str(current_user.id),
            "full_name": current_user.full_name,
            "phone_number": current_user.phone_number,
            "role": current_user.role,
            "is_active": current_user.is_active,
            "last_login": (
                current_user.last_login.isoformat()
                if current_user.last_login else None
            ),
            "patient_profile": (
                {
                    "patient_id": str(current_user.patient_profile.id),
                    "medical_record_number": (
                        current_user.patient_profile.medical_record_number
                    ),
                }
                if current_user.patient_profile else None
            ),
        },
    }