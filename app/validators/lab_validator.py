"""
اعتبارسنجی نتایج آزمایشگاهی

نکات پزشکی کلیدی:
- هر تست محدوده فیزیولوژیک مشخصی دارد که خارج از آن غیرممکن است
- در بیماران دیالیزی مقادیر مرجع با جمعیت عمومی تفاوت دارد
  * K: هدف < 5.5 (با احتیاط بیشتر از 6.0)
  * P: هدف 3.5-5.5 mg/dL
  * Hb: هدف 10-12 g/dL
  * PTH: هدف 150-600 pg/mL (2-9× بالای نرمال عمومی)
- ترکیب چند تست اهمیت بالینی دارد:
  * K بالا + HCO3 پایین = اسیدوز + هایپرکالمی (ریسک بالا)
  * Alb پایین + CRP بالا = التهاب (نه فقط سوءتغذیه)
  * Ferritin بالا + TSAT پایین = کمبود آهن عملکردی
"""

from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from app.config.thresholds import LAB_THRESHOLDS
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


def validate_lab_value(
    test_code: str,
    value: float,
    unit: str,
    db: Optional[Session] = None,
) -> LabValidationResult:
    """
    اعتبارسنجی مقدار یک آزمایش

    1. بررسی محدوده منطقی فیزیولوژیک (valid_min/max)
    2. بررسی واحد
    3. طبقه‌بندی نسبت به مرجع (نرمال/هشدار/بحرانی)

    Args:
        test_code: کد آزمایش (مثال: K, Hb, P)
        value: مقدار عددی
        unit: واحد اندازه‌گیری
        db: session دیتابیس (برای دریافت ref range)

    Returns:
        LabValidationResult
    """
    errors = []
    warnings = []
    is_abnormal = False
    is_critical = False
    abnormality_direction = None
    ref_range_low = None
    ref_range_high = None

    # ============================================================
    # بررسی کد تست
    # ============================================================
    valid_codes = {t.value for t in LabTestCode}
    if test_code not in valid_codes:
        errors.append(f"کد آزمایش '{test_code}' شناخته‌شده نیست")
        return LabValidationResult(
            is_valid=False, errors=errors, warnings=warnings
        )

    # ============================================================
    # بررسی مقدار عددی
    # ============================================================
    if value < 0:
        errors.append(f"مقدار آزمایش {test_code} نمی‌تواند منفی باشد")
        return LabValidationResult(
            is_valid=False, errors=errors, warnings=warnings
        )

    # بررسی محدوده فیزیولوژیک
    if test_code in LAB_VALID_RANGES:
        valid_min, valid_max = LAB_VALID_RANGES[test_code]
        if not (valid_min <= value <= valid_max):
            errors.append(
                f"مقدار {test_code} = {value} {unit} "
                f"خارج از محدوده فیزیولوژیک "
                f"({valid_min} - {valid_max} {unit}) است. "
                f"لطفاً مقدار را بررسی کنید."
            )
            return LabValidationResult(
                is_valid=False, errors=errors, warnings=warnings
            )

    # ============================================================
    # بررسی واحد
    # ============================================================
    expected_unit = LAB_UNITS.get(test_code)
    if expected_unit and unit != expected_unit:
        warnings.append(
            f"واحد وارد‌شده برای {test_code} ({unit}) "
            f"با واحد استاندارد ({expected_unit}) متفاوت است. "
            f"لطفاً بررسی کنید."
        )

    # ============================================================
    # دریافت ref range از DB یا thresholds
    # ============================================================
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

            # بررسی مقدار بحرانی
            if ref.critical_high and value >= ref.critical_high:
                is_critical = True
                warnings.append(
                    f"مقدار بحرانی {test_code}: {value} {unit} "
                    f">= {ref.critical_high} {unit} — اقدام فوری"
                )
            elif ref.critical_low and value <= ref.critical_low:
                is_critical = True
                warnings.append(
                    f"مقدار بحرانی {test_code}: {value} {unit} "
                    f"<= {ref.critical_low} {unit} — اقدام فوری"
                )

    else:
        # استفاده از thresholds هاردکد
        is_abnormal, abnormality_direction, is_critical, w = (
            _classify_from_thresholds(test_code, value, unit)
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


def _classify_from_thresholds(
    test_code: str,
    value: float,
    unit: str,
) -> tuple[bool, Optional[str], bool, list[str]]:
    """
    طبقه‌بندی مقدار آزمایش بر اساس thresholds هاردکد

    Returns:
        (is_abnormal, direction, is_critical, warnings)
    """
    warnings = []
    is_abnormal = False
    is_critical = False
    direction = None

    t = LAB_THRESHOLDS  # اختصار

    rules = {
        LabTestCode.POTASSIUM.value: {
            "critical_high": t.k_critical_high,
            "warning_high": t.k_warning_high,
            "normal_high": t.k_normal_high,
            "normal_low": t.k_normal_low,
            "warning_low": t.k_warning_low,
            "critical_low": t.k_critical_low,
            "critical_high_msg": (
                f"پتاسیم بحرانی ({value} mEq/L) — "
                f"ریسک آریتمی قلبی فوری"
            ),
            "critical_low_msg": (
                f"پتاسیم خیلی پایین ({value} mEq/L) — "
                f"ریسک آریتمی و ضعف عضلانی"
            ),
        },
        LabTestCode.PHOSPHORUS.value: {
            "critical_high": t.p_critical_high,
            "warning_high": t.p_warning_high,
            "normal_high": t.p_normal_high,
            "normal_low": t.p_normal_low,
            "warning_low": t.p_warning_low,
            "critical_low": t.p_critical_low,
            "critical_high_msg": (
                f"فسفر بسیار بالا ({value} mg/dL) — "
                f"ریسک Calcification و بیماری قلبی"
            ),
            "critical_low_msg": (
                f"فسفر خیلی پایین ({value} mg/dL) — "
                f"Hypophosphatemia"
            ),
        },
        LabTestCode.HEMOGLOBIN.value: {
            "critical_high": None,
            "warning_high": None,
            "normal_high": t.hb_target_high,
            "normal_low": t.hb_target_low,
            "warning_low": t.hb_warning_low,
            "critical_low": t.hb_critical_low,
            "critical_high_msg": "",
            "critical_low_msg": (
                f"هموگلوبین بحرانی ({value} g/dL) — "
                f"کم‌خونی شدید، نیاز فوری به بررسی"
            ),
        },
        LabTestCode.ALBUMIN.value: {
            "critical_high": None,
            "warning_high": None,
            "normal_high": None,
            "normal_low": t.alb_normal_low,
            "warning_low": t.alb_warning_low,
            "critical_low": t.alb_critical_low,
            "critical_high_msg": "",
            "critical_low_msg": (
                f"آلبومین بحرانی ({value} g/dL) — "
                f"سوءتغذیه شدید، مرگ‌ومیر بالاتر"
            ),
        },
        LabTestCode.POTASSIUM.value: {
            "critical_high": t.k_critical_high,
            "warning_high": t.k_warning_high,
            "normal_high": t.k_normal_high,
            "normal_low": t.k_normal_low,
            "warning_low": t.k_warning_low,
            "critical_low": t.k_critical_low,
            "critical_high_msg": f"پتاسیم بحرانی ({value} mEq/L)",
            "critical_low_msg": f"پتاسیم خیلی پایین ({value} mEq/L)",
        },
    }

    rule = rules.get(test_code)
    if not rule:
        return is_abnormal, direction, is_critical, warnings

    if rule.get("critical_high") and value >= rule["critical_high"]:
        is_critical = True
        is_abnormal = True
        direction = AbnormalityDirection.HIGH.value
        if rule.get("critical_high_msg"):
            warnings.append(rule["critical_high_msg"])
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
        if rule.get("critical_low_msg"):
            warnings.append(rule["critical_low_msg"])
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
    """
    اعتبارسنجی کل پنل آزمایش

    علاوه بر اعتبارسنجی هر تست، بررسی‌های ترکیبی (Cross-check) انجام می‌دهد.

    Args:
        results: لیست dict با کلیدهای test_code, value, unit
        db: session دیتابیس

    Returns:
        PanelValidationResult
    """
    all_errors = []
    result_map: dict[str, LabValidationResult] = {}
    cross_warnings = []

    # بررسی تکراری بودن test_code
    codes = [r.get("test_code") for r in results]
    if len(codes) != len(set(codes)):
        duplicates = [c for c in codes if codes.count(c) > 1]
        all_errors.append(
            f"آزمایش‌های تکراری در این پنل: {list(set(duplicates))}"
        )

    # اعتبارسنجی هر تست
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

    # ============================================================
    # Cross-check: بررسی ترکیبی آزمایش‌ها
    # ============================================================
    values = {
        code: results_list
        for code, results_list in result_map.items()
        if results_list.is_valid
    }
    raw_values = {r["test_code"]: r["value"] for r in results}

    # 1) K بالا + HCO3 پایین = اسیدوز + هایپرکالمی
    k_val = raw_values.get(LabTestCode.POTASSIUM.value)
    hco3_val = raw_values.get(LabTestCode.BICARBONATE.value)
    if k_val and hco3_val:
        if k_val >= 5.5 and hco3_val < 18:
            cross_warnings.append(
                "⚠️ ترکیب بحرانی: پتاسیم بالا + بی‌کربنات پایین "
                "(اسیدوز متابولیک + هایپرکالمی) — "
                "ریسک آریتمی بسیار بالا، توجه فوری لازم است"
            )

    # 2) Ferritin بالا + TSAT پایین = کمبود آهن عملکردی
    ferritin_val = raw_values.get(LabTestCode.FERRITIN.value)
    tsat_val = raw_values.get(LabTestCode.TSAT.value)
    if ferritin_val and tsat_val:
        if ferritin_val >= 500 and tsat_val < 20:
            cross_warnings.append(
                "کمبود آهن عملکردی: Ferritin بالا ولی TSAT پایین — "
                "ممکن است التهاب مانع استفاده از آهن باشد (ADOS pattern)"
            )
        if ferritin_val < 100 and tsat_val < 20:
            cross_warnings.append(
                "کمبود آهن مطلق: Ferritin پایین + TSAT پایین — "
                "نیاز به آهن درمانی"
            )

    # 3) Alb پایین + CRP بالا = التهاب (نه فقط سوءتغذیه خالص)
    alb_val = raw_values.get(LabTestCode.ALBUMIN.value)
    crp_val = raw_values.get(LabTestCode.CRP.value)
    if alb_val and crp_val:
        if alb_val < 3.5 and crp_val > 10:
            cross_warnings.append(
                "آلبومین پایین همراه با CRP بالا: "
                "احتمال التهاب سیستمیک (نه فقط سوءتغذیه). "
                "بررسی علت التهاب توصیه می‌شود."
            )

    # 4) Ca پایین + P بالا + PTH بالا = Renal Osteodystrophy
    ca_val = raw_values.get(LabTestCode.CALCIUM.value)
    p_val = raw_values.get(LabTestCode.PHOSPHORUS.value)
    pth_val = raw_values.get(LabTestCode.PTH.value)
    if ca_val and p_val and pth_val:
        if ca_val < 8.5 and p_val > 5.5 and pth_val > 800:
            cross_warnings.append(
                "الگوی Renal Osteodystrophy: Ca پایین + P بالا + PTH بسیار بالا — "
                "بررسی و مدیریت بیماری استخوان-معدنی کلیه (CKD-MBD) توصیه می‌شود"
            )

    # 5) Ca × P Product (Calcium-Phosphorus Product)
    if ca_val and p_val:
        ca_p_product = ca_val * p_val
        if ca_p_product > 55:
            cross_warnings.append(
                f"Ca × P Product = {ca_p_product:.1f} (> 55) — "
                f"ریسک بالای Vascular Calcification"
            )

    # 6) Hb پایین + Ferritin پایین + TSAT پایین
    hb_val = raw_values.get(LabTestCode.HEMOGLOBIN.value)
    if hb_val and ferritin_val and tsat_val:
        if hb_val < 10 and ferritin_val < 200 and tsat_val < 20:
            cross_warnings.append(
                "کم‌خونی فقر آهن: Hb + Ferritin + TSAT همگی پایین — "
                "نیاز فوری به آهن درمانی قبل از تنظیم EPO"
            )

    return PanelValidationResult(
        is_valid=len(all_errors) == 0,
        results=result_map,
        cross_check_warnings=cross_warnings,
        errors=all_errors,
    )


def raise_if_invalid_lab(
    test_code: str,
    value: float,
    unit: str,
    db: Optional[Session] = None,
) -> LabValidationResult:
    """اعتبارسنجی و raise exception در صورت خطا"""
    result = validate_lab_value(test_code, value, unit, db)
    if not result.is_valid:
        raise InvalidLabValueException(
            message="; ".join(result.errors),
            details={
                "test_code": test_code,
                "value": value,
                "unit": unit,
                "errors": result.errors,
            },
        )
    return result