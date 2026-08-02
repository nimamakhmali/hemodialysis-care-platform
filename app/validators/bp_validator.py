"""
اعتبارسنجی فشار خون

نکات پزشکی:
- فشار سیستولیک همیشه باید بیشتر از دیاستولیک باشد
- Pulse Pressure = Systolic - Diastolic (نرمال: 40-60 mmHg)
- فشار سیستولیک < 90 = Hypotension (بحرانی در دیالیز)
- فشار سیستولیک > 180 = Hypertensive Crisis
- IDH (Intradialytic Hypotension): افت >= 20 mmHg سیستولیک حین دیالیز
  یا سیستولیک < 90 حین دیالیز — رایج‌ترین عارضه همودیالیز (20-30% جلسات)
"""

from dataclasses import dataclass
from typing import Optional

from app.config.thresholds import BP_THRESHOLDS
from app.exceptions.business_exceptions import InvalidBPException


@dataclass
class BPReading:
    """یک خوانش فشار خون"""
    systolic: int
    diastolic: int
    label: str = ""

    @property
    def pulse_pressure(self) -> int:
        return self.systolic - self.diastolic

    @property
    def map(self) -> float:
        """Mean Arterial Pressure"""
        return round(self.diastolic + self.pulse_pressure / 3, 1)


@dataclass
class BPValidationResult:
    is_valid: bool
    errors: list[str]
    warnings: list[str]
    pulse_pressure: Optional[int] = None
    map_value: Optional[float] = None


def validate_single_bp(
    systolic: int,
    diastolic: int,
    label: str = "",
) -> BPValidationResult:
    """
    اعتبارسنجی یک جفت فشار خون

    Args:
        systolic: فشار سیستولیک (mmHg)
        diastolic: فشار دیاستولیک (mmHg)
        label: برچسب برای پیام خطا (مثلاً "قبل از دیالیز")

    Returns:
        BPValidationResult
    """
    errors = []
    warnings = []
    prefix = f"فشار خون {label}: " if label else "فشار خون: "

    # بررسی محدوده منطقی سیستولیک
    if not (
        BP_THRESHOLDS.valid_systolic_min
        <= systolic
        <= BP_THRESHOLDS.valid_systolic_max
    ):
        errors.append(
            f"{prefix}فشار سیستولیک {systolic} خارج از محدوده منطقی "
            f"({BP_THRESHOLDS.valid_systolic_min}-"
            f"{BP_THRESHOLDS.valid_systolic_max} mmHg) است"
        )

    # بررسی محدوده منطقی دیاستولیک
    if not (
        BP_THRESHOLDS.valid_diastolic_min
        <= diastolic
        <= BP_THRESHOLDS.valid_diastolic_max
    ):
        errors.append(
            f"{prefix}فشار دیاستولیک {diastolic} خارج از محدوده منطقی "
            f"({BP_THRESHOLDS.valid_diastolic_min}-"
            f"{BP_THRESHOLDS.valid_diastolic_max} mmHg) است"
        )

    if errors:
        return BPValidationResult(is_valid=False, errors=errors, warnings=warnings)

    # سیستولیک باید بیشتر از دیاستولیک باشد
    if systolic <= diastolic:
        errors.append(
            f"{prefix}فشار سیستولیک ({systolic}) باید "
            f"بیشتر از دیاستولیک ({diastolic}) باشد"
        )
        return BPValidationResult(is_valid=False, errors=errors, warnings=warnings)

    pulse_pressure = systolic - diastolic
    map_value = round(diastolic + pulse_pressure / 3, 1)

    # بررسی Pulse Pressure
    if pulse_pressure < 20:
        warnings.append(
            f"{prefix}فشار پالس ({pulse_pressure} mmHg) خیلی کم است "
            f"(احتمال Cardiac Tamponade یا Aortic Stenosis)"
        )
    elif pulse_pressure > 80:
        warnings.append(
            f"{prefix}فشار پالس ({pulse_pressure} mmHg) بالا است "
            f"(احتمال Arterial Stiffness یا Aortic Regurgitation)"
        )

    # هشدارهای بالینی
    if systolic >= BP_THRESHOLDS.pre_systolic_high_critical:
        warnings.append(
            f"{prefix}فشار خون بسیار بالا ({systolic}/{diastolic}) - "
            f"بررسی فوری لازم است"
        )
    elif systolic >= BP_THRESHOLDS.pre_systolic_high:
        warnings.append(
            f"{prefix}فشار خون بالا ({systolic}/{diastolic})"
        )

    if systolic <= BP_THRESHOLDS.pre_systolic_low_critical:
        warnings.append(
            f"{prefix}فشار خون بحرانی پایین ({systolic}/{diastolic}) - "
            f"اقدام فوری لازم است"
        )
    elif systolic <= BP_THRESHOLDS.pre_systolic_low:
        warnings.append(
            f"{prefix}فشار خون پایین ({systolic}/{diastolic})"
        )

    return BPValidationResult(
        is_valid=True,
        errors=errors,
        warnings=warnings,
        pulse_pressure=pulse_pressure,
        map_value=map_value,
    )


def validate_session_bp(
    bp_pre_systolic: Optional[int],
    bp_pre_diastolic: Optional[int],
    bp_during_systolic: Optional[int],
    bp_during_diastolic: Optional[int],
    bp_post_systolic: Optional[int],
    bp_post_diastolic: Optional[int],
) -> BPValidationResult:
    """
    اعتبارسنجی کامل فشار خون یک جلسه دیالیز

    بررسی می‌کند:
    1. هر جفت BP به صورت جداگانه
    2. منطق تغییرات بین نقاط مختلف
    3. IDH (Intradialytic Hypotension)

    نکته: هیچ‌کدام از مقادیر اجباری نیستند
    ولی اگر وارد شدند باید معتبر باشند.
    """
    all_errors = []
    all_warnings = []

    # اعتبارسنجی هر جفت BP
    bp_pairs = [
        (bp_pre_systolic, bp_pre_diastolic, "قبل از دیالیز"),
        (bp_during_systolic, bp_during_diastolic, "حین دیالیز"),
        (bp_post_systolic, bp_post_diastolic, "بعد از دیالیز"),
    ]

    for sys_val, dia_val, label in bp_pairs:
        has_sys = sys_val is not None
        has_dia = dia_val is not None

        # اگر فقط یکی وارد شده — خطا
        if has_sys != has_dia:
            all_errors.append(
                f"فشار خون {label}: هر دو مقدار سیستولیک و "
                f"دیاستولیک باید با هم وارد شوند"
            )
            continue

        if has_sys and has_dia:
            result = validate_single_bp(sys_val, dia_val, label)
            all_errors.extend(result.errors)
            all_warnings.extend(result.warnings)

    if all_errors:
        return BPValidationResult(
            is_valid=False,
            errors=all_errors,
            warnings=all_warnings,
        )

    # بررسی IDH — Intradialytic Hypotension
    if bp_pre_systolic and bp_during_systolic:
        drop = bp_pre_systolic - bp_during_systolic
        if drop >= BP_THRESHOLDS.during_systolic_drop_from_pre:
            all_warnings.append(
                f"افت فشار حین دیالیز: {drop} mmHg "
                f"(از {bp_pre_systolic} به {bp_during_systolic}) - "
                f"IDH محتمل است"
            )

    if bp_during_systolic and bp_during_systolic < BP_THRESHOLDS.during_systolic_critical_low:
        all_warnings.append(
            f"فشار سیستولیک حین دیالیز ({bp_during_systolic} mmHg) "
            f"زیر {BP_THRESHOLDS.during_systolic_critical_low} mmHg - "
            f"IDH بحرانی"
        )

    return BPValidationResult(
        is_valid=True,
        errors=all_errors,
        warnings=all_warnings,
    )


def raise_if_invalid_bp(
    systolic: int,
    diastolic: int,
    label: str = "",
) -> None:
    """
    اعتبارسنجی BP و raise کردن exception در صورت خطا
    """
    result = validate_single_bp(systolic, diastolic, label)
    if not result.is_valid:
        raise InvalidBPException(
            message="; ".join(result.errors),
            details={
                "systolic": systolic,
                "diastolic": diastolic,
                "errors": result.errors,
            },
        )