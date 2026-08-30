"""
آستانه‌های پزشکی سیستم همودیالیز

⚠️  این مقادیر باید توسط پزشک متخصص (نفرولوژیست) تأیید شوند.
    در فاز MVP به صورت هاردکد هستند و در فازهای بعدی
    قابل تنظیم از پنل ادمین خواهند بود.

منابع: KDOQI Guidelines, KDIGO 2023
"""

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class BPThreshold:
    """آستانه‌های فشار خون (mmHg)"""
    # قبل از دیالیز
    pre_systolic_low: int = 100        # پایین‌تر از این → LOW alert
    pre_systolic_low_critical: int = 90  # → HIGH alert
    pre_systolic_high: int = 160       # بالاتر از این → MEDIUM alert
    pre_systolic_high_critical: int = 180  # → HIGH alert

    pre_diastolic_low: int = 60
    pre_diastolic_high: int = 100

    # حین دیالیز (Intradialytic Hypotension - IDH)
    during_systolic_critical_low: int = 90  # IDH تعریف
    during_systolic_drop_from_pre: int = 20  # افت بیش از 20mmHg → IDH

    # بعد از دیالیز
    post_systolic_low: int = 100
    post_systolic_high: int = 160

    # محدوده معقول ورود دستی
    valid_systolic_min: int = 60
    valid_systolic_max: int = 250
    valid_diastolic_min: int = 30
    valid_diastolic_max: int = 150


@dataclass(frozen=True)
class WeightThreshold:
    """آستانه‌های وزن و IDWG"""
    # IDWG: Interdialytic Weight Gain
    # درصد نسبت به وزن خشک

    idwg_percent_warning: float = 3.0   # → MEDIUM alert + آموزش
    idwg_percent_critical: float = 5.0  # → HIGH alert

    # IDWG به کیلوگرم (برای مکمل)
    idwg_kg_warning: float = 2.0
    idwg_kg_critical: float = 3.5

    # تعداد جلسات متوالی با IDWG بالا → ConsecutiveHigh alert
    consecutive_high_idwg_count: int = 3

    # فاصله وزن بعد از دیالیز با وزن خشک (kg)
    post_dry_weight_gap_warning: float = 1.5   # → MEDIUM
    post_dry_weight_gap_critical: float = 2.5  # → HIGH

    # محدوده منطقی وزن بیمار (kg)
    valid_weight_min: float = 20.0
    valid_weight_max: float = 250.0


@dataclass(frozen=True)
class LabThreshold:
    """
    آستانه‌های آزمایشگاهی

    سطوح:
    - normal_low/high: محدوده نرمال
    - warning_low/high: خارج از نرمال ولی قابل مدیریت
    - critical_low/high: نیاز به اقدام فوری
    - valid_min/max: محدوده فیزیولوژیک معقول (ورود دستی)
    """

    # ----------------------------------------
    # پتاسیم (K) — mEq/L
    # مهم‌ترین آزمایش در دیالیز (ریسک آریتمی)
    # ----------------------------------------
    k_normal_low: float = 3.5
    k_normal_high: float = 5.0
    k_warning_high: float = 5.5    # → MEDIUM alert
    k_critical_high: float = 6.0  # → HIGH alert (ریسک آریتمی)
    k_warning_low: float = 3.5
    k_critical_low: float = 3.0   # → HIGH alert
    k_valid_min: float = 1.0
    k_valid_max: float = 10.0

    # ----------------------------------------
    # سدیم (Na) — mEq/L
    # ----------------------------------------
    na_normal_low: float = 135.0
    na_normal_high: float = 145.0
    na_warning_low: float = 130.0   # → MEDIUM
    na_critical_low: float = 125.0  # → HIGH
    na_warning_high: float = 150.0  # → MEDIUM
    na_critical_high: float = 155.0 # → HIGH
    na_valid_min: float = 110.0
    na_valid_max: float = 170.0

    # ----------------------------------------
    # کلسیم (Ca) — mg/dL
    # ----------------------------------------
    ca_normal_low: float = 8.5
    ca_normal_high: float = 10.5
    ca_warning_low: float = 8.0
    ca_critical_low: float = 7.0
    ca_warning_high: float = 10.5
    ca_critical_high: float = 12.0
    ca_valid_min: float = 4.0
    ca_valid_max: float = 16.0

    # ----------------------------------------
    # فسفر (P) — mg/dL
    # ----------------------------------------
    p_normal_low: float = 2.5
    p_normal_high: float = 4.5
    p_warning_high: float = 5.5    # → LOW alert + آموزش رژیم
    p_critical_high: float = 7.0  # → HIGH alert
    p_warning_low: float = 2.5
    p_critical_low: float = 1.5
    p_valid_min: float = 0.5
    p_valid_max: float = 15.0

    # ----------------------------------------
    # هموگلوبین (Hb) — g/dL
    # هدف در بیماران دیالیزی: 10-12 g/dL
    # ----------------------------------------
    hb_target_low: float = 10.0   # هدف درمانی
    hb_target_high: float = 12.0
    hb_warning_low: float = 10.0  # → MEDIUM alert
    hb_critical_low: float = 8.0  # → HIGH alert
    hb_valid_min: float = 3.0
    hb_valid_max: float = 20.0

    # ----------------------------------------
    # آلبومین (Alb) — g/dL
    # شاخص تغذیه
    # ----------------------------------------
    alb_normal_low: float = 3.5
    alb_warning_low: float = 3.5   # → MEDIUM alert (سوءتغذیه)
    alb_critical_low: float = 3.0  # → HIGH alert
    alb_valid_min: float = 1.0
    alb_valid_max: float = 6.0

    # ----------------------------------------
    # PTH — pg/mL
    # هدف در دیالیز: 150-600 pg/mL (KDIGO)
    # ----------------------------------------
    pth_target_low: float = 150.0
    pth_target_high: float = 600.0
    pth_warning_low: float = 100.0
    pth_warning_high: float = 800.0
    pth_critical_high: float = 1000.0
    pth_valid_min: float = 1.0
    pth_valid_max: float = 3000.0

    # ----------------------------------------
    # فریتین (Ferritin) — ng/mL
    # شاخص ذخیره آهن
    # ----------------------------------------
    ferritin_target_low: float = 200.0
    ferritin_target_high: float = 800.0
    ferritin_warning_low: float = 100.0   # → کمبود آهن
    ferritin_critical_low: float = 50.0
    ferritin_warning_high: float = 1000.0 # → التهاب احتمالی
    ferritin_valid_min: float = 1.0
    ferritin_valid_max: float = 5000.0

    # ----------------------------------------
    # TSAT — درصد
    # Transferrin Saturation
    # ----------------------------------------
    tsat_target_low: float = 20.0
    tsat_warning_low: float = 20.0   # → کمبود آهن عملکردی
    tsat_critical_low: float = 15.0
    tsat_valid_min: float = 1.0
    tsat_valid_max: float = 100.0

    # ----------------------------------------
    # CRP — mg/L
    # شاخص التهاب
    # ----------------------------------------
    crp_normal_high: float = 5.0
    crp_warning_high: float = 10.0   # → MEDIUM
    crp_critical_high: float = 50.0  # → HIGH (التهاب شدید)
    crp_valid_min: float = 0.1
    crp_valid_max: float = 500.0

    # ----------------------------------------
    # اوره (Urea) — mg/dL
    # ----------------------------------------
    urea_valid_min: float = 10.0
    urea_valid_max: float = 500.0

    # ----------------------------------------
    # کراتینین (Cr) — mg/dL
    # ----------------------------------------
    cr_valid_min: float = 0.1
    cr_valid_max: float = 50.0


@dataclass(frozen=True)
class TrendThreshold:
    """آستانه‌های تحلیل روند"""
    # تعداد نتایج برای تحلیل روند آزمایش
    lab_trend_window: int = 4
    # تعداد جلسات برای تحلیل روند BP/وزن
    session_trend_window: int = 6
    # شیب نرمال‌شده که نگران‌کننده تلقی می‌شود
    concerning_slope_threshold: float = 0.1


@dataclass(frozen=True)
class FluidThreshold:
    """آستانه‌های مصرف مایعات"""
    # حداکثر مصرف روزانه معقول (ml)
    daily_max_ml: int = 1500          # → MEDIUM alert اگر بیشتر شد
    daily_critical_ml: int = 2000     # → HIGH alert

    # محدوده منطقی ورود دستی
    valid_min_ml: int = 0
    valid_max_ml: int = 5000


@dataclass(frozen=True)
class SymptomThreshold:
    """آستانه‌های بررسی علائم"""
    # تعداد تکرار یک علامت در n روز گذشته
    recurrence_days: int = 7
    recurrence_count: int = 3        # → MEDIUM alert


# ==========================================
# Instance‌های آماده برای import
# ==========================================
BP_THRESHOLDS = BPThreshold()
WEIGHT_THRESHOLDS = WeightThreshold()
LAB_THRESHOLDS = LabThreshold()
TREND_THRESHOLDS = TrendThreshold()
FLUID_THRESHOLDS = FluidThreshold()
SYMPTOM_THRESHOLDS = SymptomThreshold()