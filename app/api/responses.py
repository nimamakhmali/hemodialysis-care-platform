# ============================================================
# app/api/responses.py
# ============================================================
"""
Response های استاندارد API

همه endpointها باید از این ساختارها استفاده کنند
تا response یکدست باشد.
"""

import math
from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[dict[str, Any]] = None


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    message: Optional[str] = None


class MessageResponse(BaseModel):
    success: bool = True
    message: str


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    data: list[T]
    total: int
    page: int
    size: int
    pages: int

    @classmethod
    def create(
        cls,
        data: list,
        total: int,
        page: int,
        size: int,
    ) -> "PaginatedResponse":
        pages = math.ceil(total / size) if size > 0 else 0
        return cls(
            data=data,
            total=total,
            page=page,
            size=size,
            pages=pages,
        )


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail


class WarningResponse(BaseModel, Generic[T]):
    """Response با داده موفق اما هشدارهای validation"""
    success: bool = True
    data: T
    warnings: list[str] = []
    message: Optional[str] = None