"""
تبدیل Business Exceptions به HTTP Responses
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.exceptions.business_exceptions import (
    PatientNotFoundException,
    UserNotFoundException,
    DuplicatePhoneNumberException,
    DuplicateMedicalRecordException,
    InvalidCredentialsException,
    InactiveUserException,
    TokenBlacklistedException,
    InsufficientPermissionsException,
    InvalidLabValueException,
    InvalidBPException,
    InvalidWeightException,
    DuplicateSessionException,
    RecommendationAlreadyReviewedException,
    OwnResourceAccessException,
    WeakPasswordException,
)


def create_error_response(
    code: str,
    message: str,
    details: dict = None,
    status_code: int = 400,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": code,
                "message": message,
                "details": details or {},
            },
        },
    )


async def patient_not_found_handler(request: Request, exc: PatientNotFoundException):
    return create_error_response(
        code="PATIENT_NOT_FOUND",
        message=exc.message,
        status_code=404,
    )


async def user_not_found_handler(request: Request, exc: UserNotFoundException):
    return create_error_response(
        code="USER_NOT_FOUND",
        message=exc.message,
        status_code=404,
    )


async def duplicate_phone_handler(request: Request, exc: DuplicatePhoneNumberException):
    return create_error_response(
        code="DUPLICATE_PHONE_NUMBER",
        message=exc.message,
        status_code=409,
    )


async def duplicate_medical_record_handler(
    request: Request, exc: DuplicateMedicalRecordException
):
    return create_error_response(
        code="DUPLICATE_MEDICAL_RECORD",
        message=exc.message,
        status_code=409,
    )


async def invalid_credentials_handler(
    request: Request, exc: InvalidCredentialsException
):
    return create_error_response(
        code="INVALID_CREDENTIALS",
        message=exc.message,
        status_code=401,
    )


async def inactive_user_handler(request: Request, exc: InactiveUserException):
    return create_error_response(
        code="INACTIVE_USER",
        message=exc.message,
        status_code=403,
    )


async def token_blacklisted_handler(request: Request, exc: TokenBlacklistedException):
    return create_error_response(
        code="TOKEN_BLACKLISTED",
        message="این توکن باطل شده است. لطفاً مجدداً وارد شوید.",
        status_code=401,
    )


async def insufficient_permissions_handler(
    request: Request, exc: InsufficientPermissionsException
):
    return create_error_response(
        code="INSUFFICIENT_PERMISSIONS",
        message=exc.message,
        status_code=403,
    )


async def invalid_lab_value_handler(request: Request, exc: InvalidLabValueException):
    return create_error_response(
        code="INVALID_LAB_VALUE",
        message=exc.message,
        details=exc.details,
        status_code=422,
    )


async def invalid_bp_handler(request: Request, exc: InvalidBPException):
    return create_error_response(
        code="INVALID_BLOOD_PRESSURE",
        message=exc.message,
        details=exc.details,
        status_code=422,
    )


async def invalid_weight_handler(request: Request, exc: InvalidWeightException):
    return create_error_response(
        code="INVALID_WEIGHT",
        message=exc.message,
        details=exc.details,
        status_code=422,
    )


async def duplicate_session_handler(request: Request, exc: DuplicateSessionException):
    return create_error_response(
        code="DUPLICATE_SESSION",
        message=exc.message,
        status_code=409,
    )


async def recommendation_reviewed_handler(
    request: Request, exc: RecommendationAlreadyReviewedException
):
    return create_error_response(
        code="RECOMMENDATION_ALREADY_REVIEWED",
        message=exc.message,
        status_code=409,
    )


async def own_resource_handler(request: Request, exc: OwnResourceAccessException):
    return create_error_response(
        code="ACCESS_DENIED",
        message=exc.message,
        status_code=403,
    )


async def weak_password_handler(request: Request, exc: WeakPasswordException):
    return create_error_response(
        code="WEAK_PASSWORD",
        message=exc.message,
        details=exc.details,
        status_code=400,
    )


async def validation_error_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        })

    return create_error_response(
        code="VALIDATION_ERROR",
        message="داده‌های ورودی نامعتبر هستند",
        details={"errors": errors},
        status_code=422,
    )


async def general_exception_handler(request: Request, exc: Exception):
    return create_error_response(
        code="INTERNAL_SERVER_ERROR",
        message="خطای داخلی سرور. لطفاً دوباره تلاش کنید.",
        status_code=500,
    )