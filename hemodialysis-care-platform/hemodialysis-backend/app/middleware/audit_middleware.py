# ============================================================
# app/middleware/audit_middleware.py
# ============================================================
"""
Audit Middleware

ثبت خودکار همه درخواست‌های تغییردهنده (POST/PUT/PATCH/DELETE)
"""

import logging
import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# Endpointهایی که نباید لاگ شوند (حجم زیاد یا اطلاعات حساس)
EXCLUDE_PATHS = {
    "/api/v1/auth/login",    # در auth_service لاگ می‌شود
    "/api/v1/auth/refresh",
    "/health",
    "/docs",
    "/openapi.json",
}

WRITE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


class AuditMiddleware(BaseHTTPMiddleware):
    """
    Middleware برای ثبت خودکار درخواست‌های تغییردهنده

    نکته: این middleware فقط metadata می‌نویسد (نه body)
    ثبت تغییرات واقعی داده در service layer انجام می‌شود.
    """

    async def dispatch(
        self,
        request: Request,
        call_next: Callable,
    ) -> Response:
        # فقط write methods
        if request.method not in WRITE_METHODS:
            return await call_next(request)

        # Exclude paths
        path = request.url.path
        if any(path.startswith(excluded) for excluded in EXCLUDE_PATHS):
            return await call_next(request)

        start_time = time.time()
        request_id = str(uuid.uuid4())

        # اضافه کردن request_id به request state برای tracing
        request.state.request_id = request_id

        response = await call_next(request)

        duration_ms = round((time.time() - start_time) * 1000, 2)

        # فقط موارد موفق یا خطاهای server را log کن
        if response.status_code < 500:
            logger.info(
                f"API [{request.method}] {path} "
                f"→ {response.status_code} "
                f"({duration_ms}ms) "
                f"| req_id={request_id}"
            )
        else:
            logger.error(
                f"API ERROR [{request.method}] {path} "
                f"→ {response.status_code} "
                f"({duration_ms}ms) "
                f"| req_id={request_id}"
            )

        return response