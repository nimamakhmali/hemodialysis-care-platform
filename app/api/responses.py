"""
ساختارهای استاندارد Response
"""

from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    """Response موفق با داده"""
    success: bool = True
    data: T
    message: Optional[str] = None


class MessageResponse(BaseModel):
    """Response موفق فقط با پیام"""
    success: bool = True
    message: str


class PaginatedResponse(BaseModel, Generic[T]):
    """Response صفحه‌بندی‌شده"""
    success: bool = True
    data: List[T]
    total: int
    page: int
    size: int
    pages: int
    has_next: bool
    has_prev: bool


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: dict = {}


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail