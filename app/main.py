"""
نقطه ورود اصلی اپلیکیشن FastAPI
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import get_settings
from app.config.database import check_db_connection

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """عملیات startup و shutdown"""
    # Startup
    if not check_db_connection():
        raise RuntimeError("❌ اتصال به دیتابیس برقرار نشد!")
    print(f"✅ {settings.APP_NAME} v{settings.APP_VERSION} راه‌اندازی شد")
    print(f"   محیط: {settings.ENVIRONMENT}")

    yield

    # Shutdown
    print("🛑 سیستم در حال خاموش شدن...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="سیستم پایش و آموزش بیماران همودیالیز",
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
    lifespan=lifespan,
)


# CORS

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Health Check

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
        "docs": "/docs",
    }