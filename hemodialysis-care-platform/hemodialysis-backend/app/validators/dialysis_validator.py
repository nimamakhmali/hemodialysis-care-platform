"""
اعتبارسنجی داده‌های جلسه دیالیز

نکات پزشکی کلیدی:
- IDWG (Interdialytic Weight Gain): وزن اضافه‌شده بین دو جلسه
  * نرمال: < 3% وزن خشک
  * هشدار: 3-5% وزن خشک
  * بحرانی: > 5% وزن خشک (ریسک ادم ریوی، Cardiac Stress)
- UF Rate = UF Volume (ml) / Time (hours)
  * UF Rate > 13 ml/kg/hr با مرگ‌ومیر بالاتر مرتبط است (KDOQI)
- Post-weight باید نزدیک به Dry Weight باشد
  * اگر post_weight >> dry_weight: Fluid Overload ادامه دارد
  * اگر post_weight << dry_weight: احتمال Over-ultrafiltration
"""

from dataclasses import dataclass
from typing import Optional

from app.config.thresholds import WEIGHT_THRESHOLDS, BP_THRESHOLDS
from app.exceptions.business_exceptions import (
    InvalidWeightException,
    InvalidBPException,
)


@dataclass
class WeightValidationResult:
    is_valid: bool
    errors: list[str]
    warnings: list[str]
    idwg_kg: Optional[float] = None
    idwg_percent: Optional[float] = None
    uf_volume: Optional[float] = None


def validate_dry_weight(
    dry_weight: float,
    patient_age: Optional[int] = None,
) -> tuple[bool, list[str]]:
    """
    اعتبارسنجی وزن خشک بیمار

    وزن خشک (Dry Weight / Target Weight):
    وزنی که بیمار در آن کمترین علائم ادم و
    پایین‌ترین فشار خون قابل تحمل را داشته باشد.

    Args:
        dry_weight: وزن خشک به kg
        patient_age: سن بیمار (اختیاری، برای هشدار بهتر)

    Returns:
        (is_valid, list_of_errors)
    """
    errors = []

    if dry_weight <= 0:
        errors.append("وزن خشک باید بیشتر از صفر باشد")
        return False, errors

    if dry_weight < WEIGHT_THRESHOLDS.valid_weight_min:
        errors.append(
            f"وزن خشک ({dry_weight} kg) کمتر از حداقل منطقی "
            f"({WEIGHT_THRESHOLDS.valid_weight_min} kg) است"
        )

    if dry_weight > WEIGHT_THRESHOLDS.valid_weight_max:
        errors.append(
            f"وزن خشک ({dry_weight} kg) بیشتر از حداکثر منطقی "
            f"({WEIGHT_THRESHOLDS.valid_weight_max} kg) است"
        )

    return len(errors) == 0, errors


def validate_session_weights(
    pre_weight: float,
    dry_weight: float,
    post_weight: Optional[float] = None,
    duration_minutes: Optional[int] = None,
) -> WeightValidationResult:
    """
    اعتبارسنجی کامل وزن‌های یک جلسه دیالیز

    Args:
        pre_weight: وزن قبل از دیالیز (kg)
        dry_weight: وزن خشک هدف (kg)
        post_weight: وزن بعد از دیالیز (kg) — اختیاری
        duration_minutes: مدت جلسه به دقیقه — برای محاسبه UF Rate

    Returns:
        WeightValidationResult
    """
    errors = []
    warnings = []
    idwg_kg = None
    idwg_percent = None
    uf_volume = None

    # ============================================================
    # اعتبارسنجی pre_weight
    # ============================================================
    if pre_weight <= 0:
        errors.append("وزن قبل از دیالیز باید بیشتر از صفر باشد")
        return WeightValidationResult(
            is_valid=False, errors=errors, warnings=warnings
        )

    if pre_weight < WEIGHT_THRESHOLDS.valid_weight_min:
        errors.append(
            f"وزن قبل از دیالیز ({pre_weight} kg) "
            f"کمتر از حداقل منطقی است"
        )

    if pre_weight > WEIGHT_THRESHOLDS.valid_weight_max:
        errors.append(
            f"وزن قبل از دیالیز ({pre_weight} kg) "
            f"بیشتر از حداکثر منطقی است"
        )

    if errors:
        return WeightValidationResult(
            is_valid=False, errors=errors, warnings=warnings
        )

    # ============================================================
    # اعتبارسنجی اختلاف pre_weight با dry_weight (IDWG)
    # ============================================================
    idwg_kg = round(pre_weight - dry_weight, 2)
    if dry_weight > 0:
        idwg_percent = round((idwg_kg / dry_weight) * 100, 2)
    else:
        idwg_percent = 0.0

    # IDWG منفی (وزن کمتر از dry weight) — غیرمعمول ولی ممکن
    if idwg_kg < -2.0:
        warnings.append(
            f"وزن قبل ({pre_weight} kg) خیلی کمتر از وزن خشک "
            f"({dry_weight} kg) است (IDWG = {idwg_kg} kg). "
            f"احتمال Over-ultrafiltration در جلسه قبل یا کاهش وزن."
        )

    # IDWG بیش از حد بالا — خطای منطقی
    if idwg_kg > 10.0:
        errors.append(
            f"اضافه وزن {idwg_kg} kg نسبت به وزن خشک "
            f"غیرمنطقی به نظر می‌رسد. وزن خشک را بررسی کنید."
        )
        return WeightValidationResult(
            is_valid=False, errors=errors, warnings=warnings,
            idwg_kg=idwg_kg, idwg_percent=idwg_percent,
        )

    # هشدارهای IDWG
    if idwg_percent is not None:
        if idwg_percent >= WEIGHT_THRESHOLDS.idwg_percent_critical:
            warnings.append(
                f"IDWG بحرانی: {idwg_percent:.1f}% از وزن خشک "
                f"({idwg_kg} kg) — ریسک ادم ریوی و Cardiac Stress بالا"
            )
        elif idwg_percent >= WEIGHT_THRESHOLDS.idwg_percent_warning:
            warnings.append(
                f"IDWG بالا: {idwg_percent:.1f}% از وزن خشک "
                f"({idwg_kg} kg) — بررسی مصرف مایعات توصیه می‌شود"
            )

    # ============================================================
    # اعتبارسنجی post_weight
    # ============================================================
    if post_weight is not None:
        if post_weight <= 0:
            errors.append("وزن بعد از دیالیز باید بیشتر از صفر باشد")
            return WeightValidationResult(
                is_valid=False, errors=errors, warnings=warnings,
                idwg_kg=idwg_kg, idwg_percent=idwg_percent,
            )

        if post_weight < WEIGHT_THRESHOLDS.valid_weight_min:
            errors.append(
                f"وزن بعد از دیالیز ({post_weight} kg) "
                f"کمتر از حداقل منطقی است"
            )

        # post_weight نباید بیشتر از pre_weight باشد
        if post_weight > pre_weight:
            errors.append(
                f"وزن بعد از دیالیز ({post_weight} kg) "
                f"نمی‌تواند بیشتر از وزن قبل ({pre_weight} kg) باشد"
            )
            return WeightValidationResult(
                is_valid=False, errors=errors, warnings=warnings,
                idwg_kg=idwg_kg, idwg_percent=idwg_percent,
            )

        # محاسبه UF Volume
        uf_volume = round(pre_weight - post_weight, 2)

        # UF Volume غیرمنطقی
        if uf_volume > 6.0:
            warnings.append(
                f"حجم اولترافیلتراسیون ({uf_volume} L) بسیار زیاد است. "
                f"بررسی صحت وزن‌ها لازم است."
            )

        # فاصله post_weight از dry_weight
        post_dry_gap = post_weight - dry_weight

        if post_dry_gap > WEIGHT_THRESHOLDS.post_dry_weight_gap_critical:
            warnings.append(
                f"وزن بعد از دیالیز ({post_weight} kg) هنوز "
                f"{post_dry_gap:.1f} kg بیشتر از وزن خشک است. "
                f"احتمال Fluid Overload باقی‌مانده."
            )
        elif post_dry_gap > WEIGHT_THRESHOLDS.post_dry_weight_gap_warning:
            warnings.append(
                f"وزن بعد ({post_weight} kg) همچنان "
                f"{post_dry_gap:.1f} kg بیشتر از وزن خشک است."
            )

        if post_dry_gap < -2.0:
            warnings.append(
                f"وزن بعد از دیالیز ({post_weight} kg) "
                f"{abs(post_dry_gap):.1f} kg کمتر از وزن خشک است. "
                f"احتمال Over-ultrafiltration — بررسی علائم Hypovolemia."
            )

        # ============================================================
        # بررسی UF Rate (اگر مدت جلسه داریم)
        # ============================================================
        if duration_minutes and duration_minutes > 0 and dry_weight > 0:
            uf_rate_ml_kg_hr = (
                (uf_volume * 1000) / dry_weight
            ) / (duration_minutes / 60)

            # KDOQI: UF Rate > 13 ml/kg/hr با مرگ‌ومیر بالاتر همراه است
            if uf_rate_ml_kg_hr > 13.0:
                warnings.append(
                    f"UF Rate بالا: {uf_rate_ml_kg_hr:.1f} ml/kg/hr "
                    f"(KDOQI توصیه: < 13 ml/kg/hr). "
                    f"ریسک IDH و آسیب قلبی بالاتر است."
                )

    return WeightValidationResult(
        is_valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
        idwg_kg=idwg_kg,
        idwg_percent=idwg_percent,
        uf_volume=uf_volume,
    )


def validate_session_duration(minutes: int) -> tuple[bool, list[str]]:
    """
    اعتبارسنجی مدت جلسه دیالیز

    جلسات همودیالیز استاندارد: 3-5 ساعت (180-300 دقیقه)
    حداقل قابل قبول: 60 دقیقه
    حداکثر: 8 ساعت (480 دقیقه) — برای SLED
    """
    errors = []

    if minutes < 60:
        errors.append(
            f"مدت جلسه ({minutes} دقیقه) کمتر از حداقل قابل قبول "
            f"(60 دقیقه) است"
        )

    if minutes > 480:
        errors.append(
            f"مدت جلسه ({minutes} دقیقه) بیشتر از حداکثر منطقی "
            f"(480 دقیقه) است"
        )

    if 60 <= minutes < 120:
        errors.append(
            f"مدت جلسه ({minutes} دقیقه) خیلی کوتاه است. "
            f"جلسه استاندارد همودیالیز معمولاً 3-5 ساعت است."
        )

    return len(errors) == 0, errors