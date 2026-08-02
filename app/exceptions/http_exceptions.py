# ============================================================
# app/exceptions/http_exceptions.py
# ============================================================
"""
HTTP Exception Handlers

نگاشت Business Exceptions به HTTP responses مناسب.
همه خطاها فرمت یکدست دارند.
"""

import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError, OperationalError

from app.exceptions.business_exceptions import (
    AlertNotFoundException,
    BaseBusinessException,
    DuplicateMedicalRecordException,
    DuplicateSessionException,
    EducationContentNotFoundException,
    InsufficientPermissionsException,
    InvalidBPException,
    InvalidCredentialsException,
    InvalidLabValueException,
    InvalidStateTransitionException,
    InvalidWeightException,
    MessageNotFoundException,
    PatientInactiveException,
    PatientNotFoundException,
    RateLimitExceededException,
    RecommendationAlreadyReviewedException,
    RecommendationNotFoundException,
    SessionEditExpiredException,
    SessionNotFoundException,
    TokenBlacklistedException,
    TokenExpiredException,
    UnauthorizedAccessException,
)

logger = logging.getLogger(__name__)


def _error_response(
    status_code: int,
    code: str,
    message: str,
    details: Optional[dict[str, Any]] = None,
) -> JSONResponse:
    """Factory برای ساخت JSON response خطا"""
    content = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
        },
    }
    if details:
        content["error"]["details"] = details

    return JSONResponse(status_code=status_code, content=content)


# ============================================================
# نگاشت Exception → (HTTP Status, پیش‌فرض)
# ============================================================
_EXCEPTION_MAP: dict[type, tuple[int, str]] = {
    # 404 Not Found
    PatientNotFoundException: (status.HTTP_404_NOT_FOUND, "PATIENT_NOT_FOUND"),
    SessionNotFoundException: (status.HTTP_404_NOT_FOUND, "SESSION_NOT_FOUND"),
    AlertNotFoundException: (status.HTTP_404_NOT_FOUND, "ALERT_NOT_FOUND"),
    RecommendationNotFoundException: (status.HTTP_404_NOT_FOUND, "RECOMMENDATION_NOT_FOUND"),
    MessageNotFoundException: (status.HTTP_404_NOT_FOUND, "MESSAGE_NOT_FOUND"),
    EducationContentNotFoundException: (status.HTTP_404_NOT_FOUND, "EDUCATION_NOT_FOUND"),

    # 400 Bad Request
    InvalidWeightException: (status.HTTP_400_BAD_REQUEST, "INVALID_WEIGHT"),
    InvalidBPException: (status.HTTP_400_BAD_REQUEST, "INVALID_BLOOD_PRESSURE"),
    InvalidLabValueException: (status.HTTP_400_BAD_REQUEST, "INVALID_LAB_VALUE"),
    DuplicateSessionException: (status.HTTP_409_CONFLICT, "DUPLICATE_SESSION"),
    DuplicateMedicalRecordException: (status.HTTP_409_CONFLICT, "DUPLICATE_MEDICAL_RECORD"),
    SessionEditExpiredException: (status.HTTP_400_BAD_REQUEST, "SESSION_EDIT_EXPIRED"),
    PatientInactiveException: (status.HTTP_400_BAD_REQUEST, "PATIENT_INACTIVE"),

    # 401 / 403
    InvalidCredentialsException: (status.HTTP_401_UNAUTHORIZED, "INVALID_CREDENTIALS"),
    TokenExpiredException: (status.HTTP_401_UNAUTHORIZED, "TOKEN_EXPIRED"),
    TokenBlacklistedException: (status.HTTP_401_UNAUTHORIZED, "TOKEN_BLACKLISTED"),
    InsufficientPermissionsException: (status.HTTP_403_FORBIDDEN, "INSUFFICIENT_PERMISSIONS"),
    UnauthorizedAccessException: (status.HTTP_403_FORBIDDEN, "UNAUTHORIZED_ACCESS"),

    # 409 Conflict
    RecommendationAlreadyReviewedException: (status.HTTP_409_CONFLICT, "ALREADY_REVIEWED"),
    InvalidStateTransitionException: (status.HTTP_409_CONFLICT, "INVALID_STATE_TRANSITION"),

    # 429
    RateLimitExceededException: (status.HTTP_429_TOO_MANY_REQUESTS, "RATE_LIMIT_EXCEEDED"),
}


def register_exception_handlers(app: FastAPI) -> None:
    """ثبت تمام exception handlers روی FastAPI app"""

    # ============================================================
    # Business Exceptions
    # ============================================================
    @app.exception_handler(BaseBusinessException)
    async def business_exception_handler(
        request: Request,
        exc: BaseBusinessException,
    ) -> JSONResponse:
        exc_type = type(exc)
        status_code, code = _EXCEPTION_MAP.get(
            exc_type,
            (status.HTTP_400_BAD_REQUEST, exc.error_code),
        )

        logger.warning(
            f"Business exception [{code}]: {exc.message} "
            f"| path={request.url.path}"
        )

        return _error_response(
            status_code=status_code,
            code=code,
            message=exc.message,
            details=exc.details if exc.details else None,
        )

    # ============================================================
    # Pydantic Validation Errors (Request body)
    # ============================================================
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        # تبدیل خطاهای pydantic به فرمت فارسی
        errors = []
        for error in exc.errors():
            field = " → ".join(str(loc) for loc in error["loc"] if loc != "body")
            errors.append({
                "field": field,
                "message": _translate_pydantic_error(error),
            })

        logger.warning(
            f"Validation error: {errors} | path={request.url.path}"
        )

        return _error_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="VALIDATION_ERROR",
            message="داده‌های ورودی معتبر نیست",
            details={"errors": errors},
        )

    # ============================================================
    # Database Errors
    # ============================================================
    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(
        request: Request,
        exc: IntegrityError,
    ) -> JSONResponse:
        logger.error(f"DB IntegrityError: {exc} | path={request.url.path}")

        # تشخیص نوع constraint violation
        error_str = str(exc.orig).lower() if exc.orig else ""

        if "unique" in error_str or "duplicate" in error_str:
            return _error_response(
                status_code=status.HTTP_409_CONFLICT,
                code="DUPLICATE_ENTRY",
                message="داده تکراری است",
            )

        if "foreign key" in error_str or "fk" in error_str:
            return _error_response(
                status_code=status.HTTP_400_BAD_REQUEST,
                code="INVALID_REFERENCE",
                message="رابطه داده‌ای نامعتبر است",
            )

        return _error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="DATABASE_ERROR",
            message="خطای پایگاه داده رخ داد",
        )

    @app.exception_handler(OperationalError)
    async def operational_error_handler(
        request: Request,
        exc: OperationalError,
    ) -> JSONResponse:
        logger.critical(f"DB OperationalError: {exc}")
        return _error_response(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            code="DATABASE_UNAVAILABLE",
            message="پایگاه داده در دسترس نیست",
        )

    # ============================================================
    # Unhandled Exceptions (500)
    # ============================================================
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        logger.critical(
            f"Unhandled exception: {type(exc).__name__}: {exc} "
            f"| path={request.url.path}",
            exc_info=True,
        )

        # در production، جزئیات را نشان نده
        return _error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_ERROR",
            message="خطای داخلی سیستم رخ داد",
        )


def _translate_pydantic_error(error: dict) -> str:
    """ترجمه ساده پیام‌های خطای pydantic به فارسی"""
    error_type = error.get("type", "")
    msg = error.get("msg", "")

    translations = {
        "missing": "این فیلد اجباری است",
        "value_error": msg,
        "type_error": "نوع داده اشتباه است",
        "string_too_short": "مقدار خیلی کوتاه است",
        "string_too_long": "مقدار خیلی طولانی است",
        "greater_than": "مقدار باید بزرگ‌تر باشد",
        "less_than": "مقدار باید کوچک‌تر باشد",
        "greater_than_equal": "مقدار باید بزرگ‌تر یا مساوی باشد",
        "less_than_equal": "مقدار باید کوچک‌تر یا مساوی باشد",
        "enum": "مقدار انتخابی معتبر نیست",
        "datetime_from_date_parsing": "فرمت تاریخ اشتباه است",
    }

    return translations.get(error_type, msg or "مقدار نامعتبر است")