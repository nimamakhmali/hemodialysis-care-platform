"""
Exception های business logic سیستم
"""


class HemodialysisBaseException(Exception):
    """Base exception سیستم"""
    def __init__(self, message: str, details: dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(message)


# ============================================================
# app/exceptions/business_exceptions.py
# ============================================================
"""
Exception های Business Logic سیستم

هر exception:
- پیام فارسی قابل فهم دارد
- کد یکتا برای HTTP handler دارد
- details اختیاری برای debug دارد
"""

from typing import Any, Optional


class BaseBusinessException(Exception):
    """پایه همه exception های business logic"""

    error_code: str = "BUSINESS_ERROR"
    default_message: str = "خطای سیستمی رخ داده است"

    def __init__(
        self,
        message: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
    ):
        self.message = message or self.default_message
        self.details = details or {}
        super().__init__(self.message)


# ============================================================
# Patient Exceptions
# ============================================================

class PatientNotFoundException(BaseBusinessException):
    error_code = "PATIENT_NOT_FOUND"
    default_message = "بیمار یافت نشد"


class DuplicateMedicalRecordException(BaseBusinessException):
    error_code = "DUPLICATE_MEDICAL_RECORD"
    default_message = "کد بیمارستانی از قبل وجود دارد"


class DuplicatePhoneNumberException(BaseBusinessException):
    error_code = "DUPLICATE_PHONE_NUMBER"
    default_message = "شماره موبایل از قبل ثبت شده است"


class PatientInactiveException(BaseBusinessException):
    error_code = "PATIENT_INACTIVE"
    default_message = "بیمار غیرفعال است"


# ============================================================
# Session Exceptions
# ============================================================

class DuplicateSessionException(BaseBusinessException):
    error_code = "DUPLICATE_SESSION"
    default_message = "جلسه دیالیز برای این تاریخ قبلاً ثبت شده است"


class SessionNotFoundException(BaseBusinessException):
    error_code = "SESSION_NOT_FOUND"
    default_message = "جلسه دیالیز یافت نشد"


class SessionEditExpiredException(BaseBusinessException):
    error_code = "SESSION_EDIT_EXPIRED"
    default_message = "مهلت ویرایش جلسه منقضی شده است"


# ============================================================
# Validation Exceptions
# ============================================================

class InvalidWeightException(BaseBusinessException):
    error_code = "INVALID_WEIGHT"
    default_message = "مقدار وزن وارد‌شده معتبر نیست"


class InvalidBPException(BaseBusinessException):
    error_code = "INVALID_BLOOD_PRESSURE"
    default_message = "مقدار فشار خون وارد‌شده معتبر نیست"


class InvalidLabValueException(BaseBusinessException):
    error_code = "INVALID_LAB_VALUE"
    default_message = "مقدار آزمایش وارد‌شده معتبر نیست"


class DuplicateLabPanelException(BaseBusinessException):
    error_code = "DUPLICATE_LAB_PANEL"
    default_message = "پنل آزمایش تکراری است"


# ============================================================
# Auth Exceptions
# ============================================================

class InvalidCredentialsException(BaseBusinessException):
    error_code = "INVALID_CREDENTIALS"
    default_message = "نام کاربری یا رمز عبور اشتباه است"


class TokenExpiredException(BaseBusinessException):
    error_code = "TOKEN_EXPIRED"
    default_message = "توکن منقضی شده است"


class TokenBlacklistedException(BaseBusinessException):
    error_code = "TOKEN_BLACKLISTED"
    default_message = "توکن باطل شده است"


class InactiveUserException(BaseBusinessException):
    error_code = "INACTIVE_USER"
    default_message = "حساب کاربری شما غیرفعال است"


class WeakPasswordException(BaseBusinessException):
    error_code = "WEAK_PASSWORD"
    default_message = "رمز عبور ضعیف است"


class InvalidPasswordException(BaseBusinessException):
    error_code = "INVALID_PASSWORD"
    default_message = "رمز عبور اشتباه است"


class InsufficientPermissionsException(BaseBusinessException):
    error_code = "INSUFFICIENT_PERMISSIONS"
    default_message = "دسترسی کافی ندارید"


class UnauthorizedAccessException(BaseBusinessException):
    error_code = "UNAUTHORIZED_ACCESS"
    default_message = "دسترسی به این منبع مجاز نیست"


class OwnResourceAccessException(BaseBusinessException):
    error_code = "OWN_RESOURCE_ACCESS"
    default_message = "شما فقط به منابع خودتان دسترسی دارید"


class RateLimitExceededException(BaseBusinessException):
    error_code = "RATE_LIMIT_EXCEEDED"
    default_message = "تعداد تلاش‌های مجاز تجاوز شده است"


# ============================================================
# Alert & Recommendation Exceptions
# ============================================================

class AlertNotFoundException(BaseBusinessException):
    error_code = "ALERT_NOT_FOUND"
    default_message = "هشدار یافت نشد"


class InvalidStateTransitionException(BaseBusinessException):
    error_code = "INVALID_STATE_TRANSITION"
    default_message = "تغییر وضعیت مجاز نیست"


class RecommendationNotFoundException(BaseBusinessException):
    error_code = "RECOMMENDATION_NOT_FOUND"
    default_message = "توصیه یافت نشد"


class RecommendationAlreadyReviewedException(BaseBusinessException):
    error_code = "RECOMMENDATION_ALREADY_REVIEWED"
    default_message = "این توصیه قبلاً بررسی شده است"


# ============================================================
# Message Exceptions
# ============================================================

class MessageNotFoundException(BaseBusinessException):
    error_code = "MESSAGE_NOT_FOUND"
    default_message = "پیام یافت نشد"


# ============================================================
# Education Exceptions
# ============================================================

class EducationContentNotFoundException(BaseBusinessException):
    error_code = "EDUCATION_NOT_FOUND"
    default_message = "محتوای آموزشی یافت نشد"


class UserNotFoundException(BaseBusinessException):
    error_code = "USER_NOT_FOUND"
    default_message = "کاربر یافت نشد"


class DuplicateTopicCodeException(BaseBusinessException):
    error_code = "DUPLICATE_TOPIC_CODE"
    default_message = "کد موضوع آموزشی تکراری است"

"""
Exception های اضافه‌شده برای TASK-024/026
"""

class AlertNotFoundException(Exception):
    def __init__(self, message: str = "هشدار یافت نشد"):
        self.message = message
        super().__init__(message)


class RecommendationNotFoundException(Exception):
    def __init__(self, message: str = "توصیه یافت نشد"):
        self.message = message
        super().__init__(message)


class RecommendationAlreadyReviewedException(Exception):
    def __init__(self, message: str = "این توصیه قبلاً بررسی شده است"):
        self.message = message
        super().__init__(message)


class InvalidStateTransitionException(Exception):
    def __init__(self, message: str = "تغییر وضعیت مجاز نیست"):
        self.message = message
        super().__init__(message)


class MessageNotFoundException(Exception):
    def __init__(self, message: str = "پیام یافت نشد"):
        self.message = message
        super().__init__(message)


class UnauthorizedAccessException(Exception):
    def __init__(self, message: str = "دسترسی مجاز نیست"):
        self.message = message
        super().__init__(message)