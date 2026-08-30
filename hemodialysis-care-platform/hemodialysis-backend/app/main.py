"""
نقطه ورود اصلی اپلیکیشن FastAPI
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.config.database import check_db_connection
from app.config.settings import get_settings
from app.exceptions.business_exceptions import (
    DuplicateMedicalRecordException,
    DuplicatePhoneNumberException,
    DuplicateSessionException,
    InactiveUserException,
    InvalidBPException,
    InvalidCredentialsException,
    InvalidLabValueException,
    InvalidWeightException,
    OwnResourceAccessException,
    PatientNotFoundException,
    RecommendationAlreadyReviewedException,
    TokenBlacklistedException,
    UserNotFoundException,
    WeakPasswordException,
)
from app.exceptions.http_exceptions import (
    duplicate_medical_record_handler,
    duplicate_phone_handler,
    duplicate_session_handler,
    general_exception_handler,
    inactive_user_handler,
    invalid_bp_handler,
    invalid_credentials_handler,
    invalid_lab_value_handler,
    invalid_weight_handler,
    own_resource_handler,
    patient_not_found_handler,
    recommendation_reviewed_handler,
    token_blacklisted_handler,
    user_not_found_handler,
    validation_error_handler,
    weak_password_handler,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """عملیات startup و shutdown"""
    if not check_db_connection():
        raise RuntimeError("❌ اتصال به دیتابیس برقرار نشد!")

    print(f"✅ {settings.APP_NAME} v{settings.APP_VERSION} راه‌اندازی شد")
    print(f"   محیط: {settings.ENVIRONMENT}")

    yield

    print("🛑 سیستم در حال خاموش شدن...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="سیستم پایش و آموزش بیماران همودیالیز",
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
    lifespan=lifespan,
)

# ==========================================
# CORS
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Exception Handlers
# ==========================================
app.add_exception_handler(PatientNotFoundException, patient_not_found_handler)
app.add_exception_handler(UserNotFoundException, user_not_found_handler)
app.add_exception_handler(DuplicatePhoneNumberException, duplicate_phone_handler)
app.add_exception_handler(DuplicateMedicalRecordException, duplicate_medical_record_handler)
app.add_exception_handler(InvalidCredentialsException, invalid_credentials_handler)
app.add_exception_handler(InactiveUserException, inactive_user_handler)
app.add_exception_handler(TokenBlacklistedException, token_blacklisted_handler)
app.add_exception_handler(InvalidLabValueException, invalid_lab_value_handler)
app.add_exception_handler(InvalidBPException, invalid_bp_handler)
app.add_exception_handler(InvalidWeightException, invalid_weight_handler)
app.add_exception_handler(DuplicateSessionException, duplicate_session_handler)
app.add_exception_handler(RecommendationAlreadyReviewedException, recommendation_reviewed_handler)
app.add_exception_handler(OwnResourceAccessException, own_resource_handler)
app.add_exception_handler(WeakPasswordException, weak_password_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(Exception, general_exception_handler)

# ==========================================
# Routers
# ==========================================
app.include_router(api_router)


# ==========================================
# Health Check
# ==========================================
@app.get("/health", tags=["System"])
def health_check():
    """بررسی وضعیت سیستم"""
    db_ok = check_db_connection()
    return {
        "status": "healthy" if db_ok else "degraded",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": "connected" if db_ok else "disconnected",
    }


@app.get("/", tags=["System"])
def root():
    return {
        "message": f"خوش آمدید به {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs" if settings.is_development else "disabled",
    }