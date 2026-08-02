"""
اعتبارسنجی داده‌های بیمار
"""

import re
from typing import Optional

from app.shared.utils import is_valid_iranian_phone, normalize_phone
from app.config.thresholds import WEIGHT_THRESHOLDS


def validate_dry_weight(dry_weight: Optional[float]) -> tuple[bool, list[str]]:
    """اعتبارسنجی وزن خشک بیمار"""
    errors = []

    if dry_weight is None:
        errors.append("وزن خشک نمی‌تواند خالی باشد")
        return False, errors

    if dry_weight <= 0:
        errors.append("وزن خشک باید مثبت باشد")

    if dry_weight < WEIGHT_THRESHOLDS.valid_weight_min:
        errors.append(
            f"وزن خشک کمتر از حداقل معقول ({WEIGHT_THRESHOLDS.valid_weight_min} kg) است"
        )

    if dry_weight > WEIGHT_THRESHOLDS.valid_weight_max:
        errors.append(
            f"وزن خشک بیشتر از حداکثر معقول ({WEIGHT_THRESHOLDS.valid_weight_max} kg) است"
        )

    return len(errors) == 0, errors


def validate_phone_number(phone: str) -> tuple[bool, str]:
    """
    اعتبارسنجی و نرمال‌سازی شماره موبایل

    Returns:
        (is_valid, normalized_phone_or_error)
    """
    normalized = normalize_phone(phone.strip())

    if not is_valid_iranian_phone(normalized):
        return False, (
            f"فرمت شماره موبایل نامعتبر است. "
            f"باید با 09 شروع شود و ۱۱ رقم باشد."
        )

    return True, normalized


def validate_medical_record_number(mrn: str) -> tuple[bool, str]:
    """اعتبارسنجی کد بیمارستانی"""
    mrn = mrn.strip()

    if not mrn:
        return False, "کد بیمارستانی نمی‌تواند خالی باشد"

    if len(mrn) < 3:
        return False, "کد بیمارستانی باید حداقل ۳ کاراکتر باشد"

    if len(mrn) > 50:
        return False, "کد بیمارستانی نمی‌تواند بیشتر از ۵۰ کاراکتر باشد"

    return True, mrn


def validate_dialysis_frequency(frequency: int) -> tuple[bool, str]:
    """
    اعتبارسنجی تعداد جلسات دیالیز در هفته

    استاندارد: ۳ بار در هفته (گاهی ۲ یا ۴)
    """
    if frequency < 2:
        return False, "تعداد جلسات دیالیز در هفته باید حداقل ۲ باشد"

    if frequency > 7:
        return False, "تعداد جلسات دیالیز در هفته نمی‌تواند بیشتر از ۷ باشد"

    return True, ""