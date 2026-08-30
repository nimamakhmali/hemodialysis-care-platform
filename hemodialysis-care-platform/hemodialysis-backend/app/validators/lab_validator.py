# ============================================================
# app/validators/lab_validator.py — نسخه refactor شده
# ============================================================
"""
اعتبارسنجی نتایج آزمایشگاهی
"""

from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from app.exceptions.business_exceptions import InvalidLabValueException
from app.models.lab_result import LabReferenceRange
from app.shared.constants import LAB_UNITS, LAB_VALID_RANGES
from app.shared.enums import AbnormalityDirection, LabTestCode


@dataclass
class LabValidationResult:
    is_valid: bool
    errors: list[str]
    warnings: list[str]
    is_abnormal: bool = False
    is_critical: bool = False
    abnormality_direction: Optional[str] = None
    ref_range_low: Optional[float] = None
    ref_range_high: Optional[float] = None


@dataclass
class PanelValidationResult:
    is_valid: bool
    results: dict[str, LabValidationResult]
    cross_check_warnings: list[str]
    errors: list[str]


# ============================================================
# تعریف قوانین طبقه‌بندی برای هر تست — بدون تکرار key
# ============================================================
_LAB_CLASSIFICATION_RULES: dict[str, dict] = {
    LabTestCode.POTASSIUM.value: {
        "critical_high": 6.0,
        "warning_high": 5.5,
        "normal_high": 5.0,
        "normal_low": 3.5,
        "warning_low": 3.0,
        "critical_low": 2.5,
        "critical_high_msg": "پتاسیم بحرانی ({v} mEq/L) — ریسک آریتمی قلبی فوری",
        "critical_low_msg": "پتاسیم خیلی پایین ({v} mEq/L) — ریسک آریتمی و ضعف عضلانی",
    },
    LabTestCode.SODIUM.value: {
        "critical_high": 155.0,
        "warning_high": 145.0,
        "normal_high": 145.0,
        "normal_low": 135.0,
        "warning_low": 130.0,
        "critical_low": 125.0,
        "critical_high_msg": "سدیم بحرانی بالا ({v} mEq/L) — Hypernatremia",
        "critical_low_msg": "سدیم بحرانی پایین ({v} mEq/L) — Hyponatremia",
    },
    LabTestCode.CALCIUM.value: {
        "critical_high": 12.0,
        "warning_high": 10.5,
        "normal_high": 10.5,
        "normal_low": 8.5,
        "warning_low": 8.0,
        "critical_low": 7.0,
        "critical_high_msg": "کلسیم بحرانی بالا ({v} mg/dL) — Hypercalcemia",
        "critical_low_msg": "کلسیم بحرانی پایین ({v} mg/dL) — Hypocalcemia",
    },
    LabTestCode.PHOSPHORUS.value: {
        "critical_high": 7.0,
        "warning_high": 5.5,
        "normal_high": 4.5,
        "normal_low": 2.5,
        "warning_low": 2.0,
        "critical_low": 1.0,
        "critical_high_msg": (
            "فسفر بسیار بالا ({v} mg/dL) — ریسک Calcification و بیماری قلبی"
        ),
        "critical_low_msg": "فسفر خیلی پایین ({v} mg/dL) — Hypophosphatemia",
    },
    LabTestCode.HEMOGLOBIN.value: {
        "critical_high": None,
        "warning_high": None,
        "normal_high": 12.0,
        "normal_low": 10.0,
        "warning_low": 9.0,
        "critical_low": 8.0,
        "critical_high_msg": "",
        "critical_low_msg": (
            "هموگلوبین بحرانی ({v} g/dL) — کم‌خونی شدید، نیاز فوری به بررسی"
        ),
    },
    LabTestCode.ALBUMIN.value: {
        "critical_high": None,
        "warning_high": None,
        "normal_high": None,
        "normal_low": 3.5,
        "warning_low": 3.2,
        "critical_low": 3.0,
        "critical_high_msg": "",
        "critical_low_msg": (
            "آلبومین بحرانی ({v} g/dL) — سوءتغذیه شدید، مرگ‌ومیر بالاتر"
        ),
    },
    LabTestCode.CRP.value: {
        "critical_high": 50.0,
        "warning_high": 10.0,
        "normal_high": 5.0,
        "normal_low": None,
        "warning_low": None,
        "critical_low": None,
        "critical_high_msg": "CRP بسیار بالا ({v} mg/L) — التهاب شدید",
        "critical_low_msg": "",
    },
    LabTestCode.PTH.value: {
        "critical_high": 1000.0,
        "warning_high": 600.0,
        "normal_high": 600.0,
        "normal_low": 150.0,
        "warning_low": 100.0,
        "critical_low": None,
        "critical_high_msg": "PTH بسیار بالا ({v} pg/mL) — Hyperparathyroidism شدید",
        "critical_low_msg": "",
    },
    LabTestCode.FERRITIN.value: {
        "critical_high": None,
        "warning_high": 800.0,
        "normal_high": 800.0,
        "normal_low": 200.0,
        "warning_low": 100.0,
        "critical_low": 50.0,
        "critical_high_msg": "",
        "critical_low_msg": "فریتین خیلی پایین ({v} ng/mL) — کمبود آهن",
    },
    LabTestCode.TSAT.value: {
        "critical_high": None,
        "warning_high": None,
        "normal_high": None,
        "normal_low": 20.0,
        "warning_low": 15.0,
        "critical_low": None,
        "critical_high_msg": "",
        "critical_low_msg": "",
    },
}


def validate_lab_value(
    test_code: str,
    value: float,
    unit: str,
    db: Optional[Session] = None,
) -> LabValidationResult:
    errors: list[str] = []
    warnings: list[str] = []
    is_abnormal = False
    is_critical = False
    abnormality_direction = None
    ref_range_low = None
    ref_range_high = None

    valid_codes = {t.value for t in LabTestCode}
    if test_code not in valid_codes:
        errors.append(f"کد آزمایش '{test_code}' شناخته‌شده نیست")
        return LabValidationResult(is_valid=False, errors=errors, warnings=warnings)

    if value < 0:
        errors.append(f"مقدار آزمایش {test_code} نمی‌تواند منفی باشد")
        return LabValidationResult(is_valid=False, errors=errors, warnings=warnings)

    if test_code in LAB_VALID_RANGES:
        valid_min, valid_max = LAB_VALID_RANGES[test_code]
        if not (valid_min <= value <= valid_max):
            errors.append(
                f"مقدار {test_code} = {value} {unit} "
                f"خارج از محدوده فیزیولوژیک ({valid_min} - {valid_max} {unit}) است"
            )
            return LabValidationResult(is_valid=False, errors=errors, warnings=warnings)

    expected_unit = LAB_UNITS.get(test_code)
    if expected_unit and unit != expected_unit:
        warnings.append(
            f"واحد وارد‌شده برای {test_code} ({unit}) "
            f"با واحد استاندارد ({expected_unit}) متفاوت است"
        )

    if db:
        ref = db.query(LabReferenceRange).filter(
            LabReferenceRange.test_code == test_code,
            LabReferenceRange.is_active == True,
        ).first()

        if ref:
            ref_range_low = ref.normal_low
            ref_range_high = ref.normal_high
            is_abnormal, direction = ref.classify_value(value)
            abnormality_direction = direction.value if direction else None

            if ref.critical_high and value >= ref.critical_high:
                is_critical = True
                warnings.append(
                    f"مقدار بحرانی {test_code}: {value} {unit} — اقدام فوری"
                )
            elif ref.critical_low and value <= ref.critical_low:
                is_critical = True
                warnings.append(
                    f"مقدار بحرانی {test_code}: {value} {unit} — اقدام فوری"
                )
    else:
        is_abnormal, abnormality_direction, is_critical, w = (
            _classify_from_rules(test_code, value)
        )
        warnings.extend(w)

    return LabValidationResult(
        is_valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
        is_abnormal=is_abnormal,
        is_critical=is_critical,
        abnormality_direction=abnormality_direction,
        ref_range_low=ref_range_low,
        ref_range_high=ref_range_high,
    )


def _classify_from_rules(
    test_code: str,
    value: float,
) -> tuple[bool, Optional[str], bool, list[str]]:
    """طبقه‌بندی با استفاده از _LAB_CLASSIFICATION_RULES — بدون تکرار"""
    warnings: list[str] = []
    rule = _LAB_CLASSIFICATION_RULES.get(test_code)
    if not rule:
        return False, None, False, warnings

    is_abnormal = False
    is_critical = False
    direction = None

    def fmt(msg: str) -> str:
        return msg.format(v=value) if msg else ""

    if rule.get("critical_high") and value >= rule["critical_high"]:
        is_critical = True
        is_abnormal = True
        direction = AbnormalityDirection.HIGH.value
        msg = fmt(rule.get("critical_high_msg", ""))
        if msg:
            warnings.append(msg)
    elif rule.get("warning_high") and value >= rule["warning_high"]:
        is_abnormal = True
        direction = AbnormalityDirection.HIGH.value
    elif rule.get("normal_high") and value > rule["normal_high"]:
        is_abnormal = True
        direction = AbnormalityDirection.HIGH.value
    elif rule.get("critical_low") and value <= rule["critical_low"]:
        is_critical = True
        is_abnormal = True
        direction = AbnormalityDirection.LOW.value
        msg = fmt(rule.get("critical_low_msg", ""))
        if msg:
            warnings.append(msg)
    elif rule.get("warning_low") and value <= rule["warning_low"]:
        is_abnormal = True
        direction = AbnormalityDirection.LOW.value
    elif rule.get("normal_low") and value < rule["normal_low"]:
        is_abnormal = True
        direction = AbnormalityDirection.LOW.value

    return is_abnormal, direction, is_critical, warnings


def validate_lab_panel(
    results: list[dict],
    db: Optional[Session] = None,
) -> PanelValidationResult:
    all_errors: list[str] = []
    result_map: dict[str, LabValidationResult] = {}
    cross_warnings: list[str] = []

    codes = [r.get("test_code") for r in results]
    if len(codes) != len(set(codes)):
        duplicates = list({c for c in codes if codes.count(c) > 1})
        all_errors.append(f"آزمایش‌های تکراری در این پنل: {duplicates}")

    for result in results:
        test_code = result.get("test_code", "")
        value = result.get("value")
        unit = result.get("unit", "")

        if value is None:
            all_errors.append(f"مقدار آزمایش {test_code} وارد نشده است")
            continue

        validation = validate_lab_value(test_code, float(value), unit, db)
        result_map[test_code] = validation

        if not validation.is_valid:
            all_errors.extend(validation.errors)

    raw_values = {r["test_code"]: r["value"] for r in results if "value" in r}
    cross_warnings = _run_cross_checks(raw_values)

    return PanelValidationResult(
        is_valid=len(all_errors) == 0,
        results=result_map,
        cross_check_warnings=cross_warnings,
        errors=all_errors,
    )


def _run_cross_checks(raw_values: dict) -> list[str]:
    """بررسی ترکیبی آزمایش‌ها — جدا از validate برای خوانایی"""
    warnings: list[str] = []

    k = raw_values.get(LabTestCode.POTASSIUM.value)
    hco3 = raw_values.get(LabTestCode.BICARBONATE.value)
    if k and hco3 and k >= 5.5 and hco3 < 18:
        warnings.append(
            "⚠️ ترکیب بحرانی: پتاسیم بالا + بی‌کربنات پایین "
            "(اسیدوز + هایپرکالمی) — ریسک آریتمی بسیار بالا"
        )

    ferritin = raw_values.get(LabTestCode.FERRITIN.value)
    tsat = raw_values.get(LabTestCode.TSAT.value)
    if ferritin and tsat:
        if ferritin >= 500 and tsat < 20:
            warnings.append(
                "کمبود آهن عملکردی: Ferritin بالا + TSAT پایین (ADOS pattern)"
            )
        if ferritin < 100 and tsat < 20:
            warnings.append("کمبود آهن مطلق: Ferritin + TSAT هر دو پایین")

    alb = raw_values.get(LabTestCode.ALBUMIN.value)
    crp = raw_values.get(LabTestCode.CRP.value)
    if alb and crp and alb < 3.5 and crp > 10:
        warnings.append(
            "آلبومین پایین + CRP بالا: احتمال التهاب سیستمیک "
            "(نه فقط سوءتغذیه)"
        )

    ca = raw_values.get(LabTestCode.CALCIUM.value)
    p = raw_values.get(LabTestCode.PHOSPHORUS.value)
    pth = raw_values.get(LabTestCode.PTH.value)
    if ca and p and pth and ca < 8.5 and p > 5.5 and pth > 800:
        warnings.append(
            "الگوی Renal Osteodystrophy: Ca پایین + P بالا + PTH بسیار بالا"
        )

    if ca and p:
        product = ca * p
        if product > 55:
            warnings.append(
                f"Ca × P Product = {product:.1f} (> 55) — "
                "ریسک Vascular Calcification"
            )

    hb = raw_values.get(LabTestCode.HEMOGLOBIN.value)
    if hb and ferritin and tsat and hb < 10 and ferritin < 200 and tsat < 20:
        warnings.append(
            "کم‌خونی فقر آهن: Hb + Ferritin + TSAT همگی پایین — "
            "نیاز فوری به آهن درمانی"
        )

    return warnings


def raise_if_invalid_lab(
    test_code: str,
    value: float,
    unit: str,
    db: Optional[Session] = None,
) -> LabValidationResult:
    result = validate_lab_value(test_code, value, unit, db)
    if not result.is_valid:
        raise InvalidLabValueException(
            message="; ".join(result.errors),
            details={"test_code": test_code, "value": value, "unit": unit},
        )
    return result