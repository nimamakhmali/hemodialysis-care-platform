"""
توابع کمکی مشترک سیستم
"""

import math
from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

from app.shared.enums import TrendDirection



# محاسبات پزشکی


def calculate_idwg(
    pre_weight: float,
    dry_weight: float,
) -> tuple[float, float]:
    """
    محاسبه افزایش وزن بین جلسات (IDWG)

    Args:
        pre_weight: وزن قبل از دیالیز (kg)
        dry_weight: وزن خشک هدف (kg)

    Returns:
        tuple: (idwg_kg, idwg_percent)
    """
    idwg_kg = pre_weight - dry_weight
    if dry_weight > 0:
        idwg_percent = (idwg_kg / dry_weight) * 100
    else:
        idwg_percent = 0.0
    return round(idwg_kg, 2), round(idwg_percent, 2)


def calculate_uf_volume(
    pre_weight: float,
    post_weight: float,
) -> float:
    """
    محاسبه حجم اولترافیلتراسیون (آب خارج‌شده)

    Args:
        pre_weight: وزن قبل (kg)
        post_weight: وزن بعد (kg)

    Returns:
        uf_volume: حجم به لیتر (تقریباً 1kg ≈ 1L)
    """
    return round(pre_weight - post_weight, 2)


def calculate_map(systolic: int, diastolic: int) -> float:
    """
    محاسبه فشار متوسط شریانی (MAP)
    MAP = DBP + 1/3 × (SBP - DBP)

    Args:
        systolic: فشار سیستولیک
        diastolic: فشار دیاستولیک

    Returns:
        MAP به mmHg
    """
    return round(diastolic + (systolic - diastolic) / 3, 1)


def calculate_bp_drop(
    pre_systolic: Optional[int],
    during_systolic: Optional[int],
) -> Optional[float]:
    """
    محاسبه افت فشار حین دیالیز نسبت به قبل

    Returns:
        مقدار افت (مثبت یعنی افت فشار)
        None اگر یکی از مقادیر وجود نداشت
    """
    if pre_systolic is None or during_systolic is None:
        return None
    return float(pre_systolic - during_systolic)



# تحلیل روند ساده


def classify_trend_direction(
    values: list[float],
    threshold: float = 0.05,
) -> TrendDirection:
    """
    تشخیص جهت روند بر اساس لیست مقادیر

    Args:
        values: لیست مقادیر به ترتیب زمانی
        threshold: آستانه slope برای تشخیص تغییر

    Returns:
        TrendDirection
    """
    if len(values) < 2:
        return TrendDirection.STABLE

    n = len(values)
    x = list(range(n))
    mean_x = sum(x) / n
    mean_y = sum(values) / n

    numerator = sum((x[i] - mean_x) * (values[i] - mean_y) for i in range(n))
    denominator = sum((x[i] - mean_x) ** 2 for i in range(n))

    if denominator == 0:
        return TrendDirection.STABLE

    slope = numerator / denominator

    # نرمال‌سازی slope نسبت به میانگین
    if mean_y != 0:
        normalized_slope = slope / abs(mean_y)
    else:
        normalized_slope = slope

    if normalized_slope > threshold:
        return TrendDirection.INCREASING
    elif normalized_slope < -threshold:
        return TrendDirection.DECREASING
    else:
        return TrendDirection.STABLE


def format_trend_fa(direction: TrendDirection) -> str:
    """نمایش فارسی جهت روند"""
    mapping = {
        TrendDirection.INCREASING: "افزایشی 📈",
        TrendDirection.DECREASING: "کاهشی 📉",
        TrendDirection.STABLE: "پایدار ➡️",
    }
    return mapping.get(direction, "نامشخص")



# Pagination


def paginate(
    total: int,
    page: int,
    size: int,
) -> dict[str, Any]:
    """
    محاسبه اطلاعات صفحه‌بندی

    Args:
        total: تعداد کل رکوردها
        page: شماره صفحه جاری (از 1)
        size: اندازه هر صفحه

    Returns:
        dict با اطلاعات pagination
    """
    pages = math.ceil(total / size) if size > 0 else 0
    return {
        "total": total,
        "page": page,
        "size": size,
        "pages": pages,
        "has_next": page < pages,
        "has_prev": page > 1,
    }


def get_offset(page: int, size: int) -> int:
    """محاسبه offset برای query دیتابیس"""
    return (page - 1) * size



# فرمت‌های نمایش


def format_weight(value: float) -> str:
    """نمایش وزن با واحد"""
    return f"{value:.1f} kg"


def format_bp(systolic: Optional[int], diastolic: Optional[int]) -> str:
    """نمایش فشار خون"""
    if systolic is None or diastolic is None:
        return "—"
    return f"{systolic}/{diastolic} mmHg"


def format_lab_value(value: float, unit: str) -> str:
    """نمایش مقدار آزمایش با واحد"""
    return f"{value:.1f} {unit}"


def mask_phone_number(phone: str) -> str:
    """مخفی کردن بخشی از شماره تلفن برای privacy"""
    if len(phone) >= 7:
        return phone[:4] + "***" + phone[-3:]
    return "***"



# ولیدیشن


def is_valid_iranian_phone(phone: str) -> bool:
    """
    بررسی فرمت شماره موبایل ایرانی

    فرمت: 09XXXXXXXXX
    """
    phone = phone.strip()
    if not phone.startswith("09"):
        return False
    if len(phone) != 11:
        return False
    if not phone.isdigit():
        return False
    return True


def normalize_phone(phone: str) -> str:
    """نرمال‌سازی شماره تلفن"""
    phone = phone.strip()
    # حذف +98 یا 0098
    if phone.startswith("+98"):
        phone = "0" + phone[3:]
    elif phone.startswith("0098"):
        phone = "0" + phone[4:]
    return phone


def safe_divide(numerator: float, denominator: float,
                default: float = 0.0) -> float:
    """تقسیم ایمن با جلوگیری از ZeroDivisionError"""
    if denominator == 0:
        return default
    return numerator / denominator