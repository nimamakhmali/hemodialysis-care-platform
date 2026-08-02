"""
تحلیل روند پارامترهای بالینی

هدف: تشخیص روندهای تدریجی که از Rule‌های نقطه‌ای می‌گریزند.
بیمار ممکن است هنوز از threshold رد نشده باشد اما روند
نگران‌کننده‌ای داشته باشد که زودتر باید مداخله شود.

روش: Linear Regression Slope + طبقه‌بندی روند
"""

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.dialysis_session import DialysisSession
from app.models.lab_result import LabPanel, LabResult
from app.shared.enums import LabTestCode
from app.shared.utils import calculate_slope


# ============================================================
# Data Classes
# ============================================================

@dataclass
class TrendPoint:
    """یک نقطه داده در روند"""
    date: date
    value: float
    is_abnormal: bool = False
    is_critical: bool = False


@dataclass
class TrendResult:
    """نتیجه تحلیل روند یک پارامتر"""
    test_code: str
    test_name_fa: str
    unit: str

    # نقاط داده
    points: list[TrendPoint] = field(default_factory=list)

    # شیب خط (مثبت = صعودی، منفی = نزولی)
    slope: float = 0.0

    # جهت روند
    direction: str = "stable"  # increasing / decreasing / stable

    # آیا روند نگران‌کننده است؟
    is_concerning: bool = False

    # شدت نگرانی
    concern_severity: Optional[str] = None  # low / medium / high

    # پیش‌بینی مقدار بعدی
    predicted_next_value: Optional[float] = None

    # توضیح فارسی
    interpretation_fa: str = ""

    # توضیح اضافه برای کلینیسین
    clinician_note: str = ""

    @property
    def latest_value(self) -> Optional[float]:
        return self.points[-1].value if self.points else None

    @property
    def n_points(self) -> int:
        return len(self.points)

    @property
    def values(self) -> list[float]:
        return [p.value for p in self.points]


@dataclass
class BPTrendResult:
    """نتیجه تحلیل روند فشار خون"""
    systolic_trend: TrendResult
    diastolic_trend: TrendResult
    idh_frequency: float  # درصد جلسات با IDH
    overall_direction: str  # increasing / decreasing / stable
    interpretation_fa: str = ""


@dataclass
class PatientTrendSummary:
    """خلاصه تمام روندهای یک بیمار"""
    patient_id: str
    analyzed_at: datetime
    lab_trends: list[TrendResult] = field(default_factory=list)
    weight_trend: Optional[TrendResult] = None
    bp_trend: Optional[BPTrendResult] = None
    concerning_trends: list[TrendResult] = field(default_factory=list)
    overall_deteriorating: bool = False
    summary_fa: str = ""


# ============================================================
# آستانه‌های روند برای هر پارامتر
# ============================================================

# slope_threshold: حداقل شیب برای "معنی‌دار" بودن روند
# concerning_direction: جهتی که نگران‌کننده است (increasing/decreasing/both)
# severity_thresholds: {slope: severity}
LAB_TREND_CONFIG = {
    LabTestCode.POTASSIUM.value: {
        "slope_threshold": 0.1,
        "concerning_direction": "increasing",
        "interpretation": {
            "increasing": "روند صعودی پتاسیم — خطر آریتمی در صورت ادامه",
            "decreasing": "روند نزولی پتاسیم",
            "stable": "پتاسیم پایدار",
        },
    },
    LabTestCode.HEMOGLOBIN.value: {
        "slope_threshold": 0.2,
        "concerning_direction": "decreasing",
        "interpretation": {
            "increasing": "روند بهبود هموگلوبین",
            "decreasing": "روند نزولی هموگلوبین — ریسک کم‌خونی",
            "stable": "هموگلوبین پایدار",
        },
    },
    LabTestCode.ALBUMIN.value: {
        "slope_threshold": 0.1,
        "concerning_direction": "decreasing",
        "interpretation": {
            "increasing": "روند بهبود آلبومین",
            "decreasing": "روند نزولی آلبومین — ریسک سوءتغذیه",
            "stable": "آلبومین پایدار",
        },
    },
    LabTestCode.PHOSPHORUS.value: {
        "slope_threshold": 0.2,
        "concerning_direction": "increasing",
        "interpretation": {
            "increasing": "روند صعودی فسفر — ریسک Calcification",
            "decreasing": "روند بهبود فسفر",
            "stable": "فسفر پایدار",
        },
    },
    LabTestCode.CALCIUM.value: {
        "slope_threshold": 0.2,
        "concerning_direction": "both",
        "interpretation": {
            "increasing": "روند صعودی کلسیم",
            "decreasing": "روند نزولی کلسیم",
            "stable": "کلسیم پایدار",
        },
    },
    LabTestCode.PTH.value: {
        "slope_threshold": 30,
        "concerning_direction": "increasing",
        "interpretation": {
            "increasing": "روند صعودی PTH — بررسی CKD-MBD",
            "decreasing": "روند بهبود PTH",
            "stable": "PTH پایدار",
        },
    },
    LabTestCode.CRP.value: {
        "slope_threshold": 2,
        "concerning_direction": "increasing",
        "interpretation": {
            "increasing": "روند افزایش CRP — ریسک التهاب مزمن",
            "decreasing": "روند کاهش CRP",
            "stable": "CRP پایدار",
        },
    },
}

WEIGHT_TREND_CONFIG = {
    "slope_threshold": 0.5,  # درصد در هر جلسه
    "concerning_direction": "increasing",
    "interpretation": {
        "increasing": "روند صعودی IDWG — عدم رعایت مایعات",
        "decreasing": "روند بهبود IDWG",
        "stable": "IDWG پایدار",
    },
}

BP_TREND_CONFIG = {
    "slope_threshold": 3.0,  # mmHg در هر جلسه
    "interpretation": {
        "increasing": "روند صعودی فشار خون",
        "decreasing": "روند نزولی فشار خون",
        "stable": "فشار خون پایدار",
    },
}


# ============================================================
# TrendAnalyzer
# ============================================================

class TrendAnalyzer:
    """
    تحلیل‌گر روند پارامترهای بالینی

    طراحی:
    - مستقل از Rule Engine (می‌تواند جداگانه استفاده شود)
    - خروجی‌ها structured و قابل تفسیر
    - از DB داده می‌گیرد (برخلاف Rules که از Context)
    """

    def __init__(self):
        from app.shared.constants import LAB_NAMES_FA, LAB_UNITS
        self._lab_names_fa = LAB_NAMES_FA
        self._lab_units = LAB_UNITS

    # ============================================================
    # Core Calculation Methods
    # ============================================================

    def classify_trend(
        self,
        slope: float,
        threshold: float,
        concerning_direction: str = "both",
    ) -> tuple[str, bool]:
        """
        طبقه‌بندی روند

        Returns:
            (direction, is_concerning)
        """
        if abs(slope) < threshold:
            return "stable", False

        direction = "increasing" if slope > 0 else "decreasing"

        is_concerning = (
            concerning_direction == "both"
            or concerning_direction == direction
        )

        return direction, is_concerning

    def predict_next_value(
        self,
        values: list[float],
        slope: float,
    ) -> float:
        """
        پیش‌بینی مقدار بعدی با Linear Extrapolation
        """
        if not values:
            return 0.0
        return round(values[-1] + slope, 2)

    def get_concern_severity(
        self,
        slope: float,
        threshold: float,
    ) -> Optional[str]:
        """تعیین شدت نگرانی بر اساس قدر مطلق شیب"""
        abs_slope = abs(slope)
        if abs_slope < threshold:
            return None
        if abs_slope < threshold * 2:
            return "low"
        if abs_slope < threshold * 4:
            return "medium"
        return "high"

    # ============================================================
    # Lab Trend Analysis
    # ============================================================

    def analyze_lab_trend(
        self,
        db: Session,
        patient_id: UUID,
        test_code: str,
        n_results: int = 4,
    ) -> TrendResult:
        """
        تحلیل روند یک آزمایش

        Args:
            db: session دیتابیس
            patient_id: شناسه بیمار
            test_code: کد آزمایش (مثال: K, Hb)
            n_results: تعداد نتایج برای تحلیل

        Returns:
            TrendResult کامل
        """
        config = LAB_TREND_CONFIG.get(test_code, {})
        name_fa = self._lab_names_fa.get(test_code, test_code)
        unit = self._lab_units.get(test_code, "")

        # دریافت داده از DB
        results = (
            db.query(LabResult)
            .join(LabPanel)
            .filter(
                LabResult.patient_id == patient_id,
                LabResult.test_code == test_code,
            )
            .order_by(desc(LabPanel.collected_at))
            .limit(n_results)
            .all()
        )

        results = list(reversed(results))  # قدیم → جدید

        if len(results) < 2:
            return TrendResult(
                test_code=test_code,
                test_name_fa=name_fa,
                unit=unit,
                points=[
                    TrendPoint(
                        date=r.panel.collected_at if r.panel else date.today(),
                        value=r.value,
                        is_abnormal=r.is_abnormal,
                        is_critical=r.is_critical,
                    )
                    for r in results
                ],
                interpretation_fa="داده کافی برای تحلیل روند وجود ندارد",
            )

        # ساخت نقاط
        points = [
            TrendPoint(
                date=r.panel.collected_at if r.panel else date.today(),
                value=r.value,
                is_abnormal=r.is_abnormal,
                is_critical=r.is_critical,
            )
            for r in results
        ]

        values = [p.value for p in points]
        slope = calculate_slope(values)

        slope_threshold = config.get("slope_threshold", 0.1)
        concerning_dir = config.get("concerning_direction", "both")

        direction, is_concerning = self.classify_trend(
            slope, slope_threshold, concerning_dir
        )

        concern_severity = (
            self.get_concern_severity(slope, slope_threshold)
            if is_concerning else None
        )

        predicted_next = self.predict_next_value(values, slope)

        interpretation_map = config.get("interpretation", {})
        interpretation_fa = interpretation_map.get(direction, "")

        # توضیح اضافه
        clinician_note = ""
        if is_concerning and concern_severity in ("medium", "high"):
            clinician_note = (
                f"روند {direction} با شیب {slope:+.3f} {unit}/آزمایش. "
                f"پیش‌بینی آزمایش بعد: {predicted_next:.2f} {unit}."
            )

        return TrendResult(
            test_code=test_code,
            test_name_fa=name_fa,
            unit=unit,
            points=points,
            slope=slope,
            direction=direction,
            is_concerning=is_concerning,
            concern_severity=concern_severity,
            predicted_next_value=predicted_next,
            interpretation_fa=interpretation_fa,
            clinician_note=clinician_note,
        )

    # ============================================================
    # Weight / IDWG Trend Analysis
    # ============================================================

    def analyze_weight_trend(
        self,
        db: Session,
        patient_id: UUID,
        n_sessions: int = 6,
    ) -> TrendResult:
        """
        تحلیل روند IDWG در جلسات اخیر
        """
        sessions = (
            db.query(DialysisSession)
            .filter(DialysisSession.patient_id == patient_id)
            .order_by(desc(DialysisSession.session_date))
            .limit(n_sessions)
            .all()
        )
        sessions = list(reversed(sessions))

        # فقط جلساتی که IDWG دارند
        valid = [
            s for s in sessions
            if s.weight_gain_percent is not None
        ]

        if len(valid) < 2:
            return TrendResult(
                test_code="IDWG",
                test_name_fa="افزایش وزن بین جلسات",
                unit="%",
                interpretation_fa="داده کافی وجود ندارد",
            )

        points = [
            TrendPoint(
                date=s.session_date,
                value=s.weight_gain_percent,
                is_abnormal=s.weight_gain_percent >= 3.0,
                is_critical=s.weight_gain_percent >= 5.0,
            )
            for s in valid
        ]

        values = [p.value for p in points]
        slope = calculate_slope(values)

        config = WEIGHT_TREND_CONFIG
        direction, is_concerning = self.classify_trend(
            slope,
            config["slope_threshold"],
            config["concerning_direction"],
        )

        concern_severity = self.get_concern_severity(
            slope, config["slope_threshold"]
        ) if is_concerning else None

        predicted_next = self.predict_next_value(values, slope)

        interpretation_fa = config["interpretation"].get(direction, "")
        if is_concerning:
            interpretation_fa += (
                f" (شیب: {slope:+.2f}%/جلسه، "
                f"پیش‌بینی بعدی: {predicted_next:.1f}%)"
            )

        return TrendResult(
            test_code="IDWG",
            test_name_fa="افزایش وزن بین جلسات",
            unit="%",
            points=points,
            slope=slope,
            direction=direction,
            is_concerning=is_concerning,
            concern_severity=concern_severity,
            predicted_next_value=predicted_next,
            interpretation_fa=interpretation_fa,
        )

    # ============================================================
    # Blood Pressure Trend Analysis
    # ============================================================

    def analyze_bp_trend(
        self,
        db: Session,
        patient_id: UUID,
        n_sessions: int = 6,
    ) -> BPTrendResult:
        """
        تحلیل روند فشار خون در جلسات اخیر
        """
        sessions = (
            db.query(DialysisSession)
            .filter(DialysisSession.patient_id == patient_id)
            .order_by(desc(DialysisSession.session_date))
            .limit(n_sessions)
            .all()
        )
        sessions = list(reversed(sessions))

        # Systolic
        sys_data = [
            (s.session_date, s.bp_pre_systolic)
            for s in sessions
            if s.bp_pre_systolic is not None
        ]

        # Diastolic
        dia_data = [
            (s.session_date, s.bp_pre_diastolic)
            for s in sessions
            if s.bp_pre_diastolic is not None
        ]

        # IDH frequency
        total = len(sessions)
        idh_count = sum(1 for s in sessions if s.had_intradialytic_hypotension)
        idh_freq = round(idh_count / total * 100, 1) if total > 0 else 0.0

        def build_bp_trend(
            data: list[tuple],
            param_name: str,
            unit: str,
        ) -> TrendResult:
            if len(data) < 2:
                return TrendResult(
                    test_code=param_name,
                    test_name_fa=f"فشار {param_name} قبل دیالیز",
                    unit=unit,
                    interpretation_fa="داده کافی وجود ندارد",
                )

            points = [
                TrendPoint(date=d, value=float(v))
                for d, v in data
            ]
            values = [p.value for p in points]
            slope = calculate_slope(values)

            config = BP_TREND_CONFIG
            direction, is_concerning = self.classify_trend(
                slope, config["slope_threshold"], "both"
            )

            concern_severity = self.get_concern_severity(
                slope, config["slope_threshold"]
            ) if is_concerning else None

            predicted = self.predict_next_value(values, slope)
            interp = config["interpretation"].get(direction, "")

            return TrendResult(
                test_code=param_name,
                test_name_fa=f"فشار {param_name} قبل دیالیز",
                unit=unit,
                points=points,
                slope=slope,
                direction=direction,
                is_concerning=is_concerning,
                concern_severity=concern_severity,
                predicted_next_value=predicted,
                interpretation_fa=interp,
            )

        sys_trend = build_bp_trend(sys_data, "سیستولیک", "mmHg")
        dia_trend = build_bp_trend(dia_data, "دیاستولیک", "mmHg")

        # تعیین جهت کلی
        directions = [
            t.direction for t in [sys_trend, dia_trend]
            if t.direction != "stable"
        ]
        overall = "stable"
        if directions:
            from collections import Counter
            overall = Counter(directions).most_common(1)[0][0]

        interpretation_fa = ""
        if overall != "stable":
            direction_fa = "صعودی" if overall == "increasing" else "نزولی"
            interpretation_fa = f"روند کلی {direction_fa} فشار خون"
            if idh_freq >= 30:
                interpretation_fa += (
                    f" + IDH در {idh_freq:.0f}% جلسات"
                )

        return BPTrendResult(
            systolic_trend=sys_trend,
            diastolic_trend=dia_trend,
            idh_frequency=idh_freq,
            overall_direction=overall,
            interpretation_fa=interpretation_fa,
        )

    # ============================================================
    # Full Patient Trend Analysis
    # ============================================================

    def detect_gradual_deterioration(
        self,
        db: Session,
        patient_id: UUID,
    ) -> PatientTrendSummary:
        """
        اجرای تحلیل روند روی همه پارامترها

        بیمارانی که هنوز از threshold رد نشده‌اند
        اما روند نگران‌کننده دارند را شناسایی می‌کند.

        این متد برای Celery daily job استفاده می‌شود.
        """
        from uuid import UUID as UUID_type

        analyzed_at = datetime.now(timezone.utc)
        lab_trends: list[TrendResult] = []

        # تحلیل آزمایش‌های اصلی
        priority_tests = [
            LabTestCode.POTASSIUM.value,
            LabTestCode.HEMOGLOBIN.value,
            LabTestCode.ALBUMIN.value,
            LabTestCode.PHOSPHORUS.value,
            LabTestCode.CRP.value,
            LabTestCode.PTH.value,
            LabTestCode.CALCIUM.value,
        ]

        for test_code in priority_tests:
            trend = self.analyze_lab_trend(db, patient_id, test_code)
            if trend.n_points >= 2:
                lab_trends.append(trend)

        # تحلیل وزن
        weight_trend = self.analyze_weight_trend(db, patient_id)

        # تحلیل BP
        bp_trend = self.analyze_bp_trend(db, patient_id)

        # جمع‌آوری روندهای نگران‌کننده
        concerning = [t for t in lab_trends if t.is_concerning]

        if weight_trend.is_concerning:
            concerning.append(weight_trend)

        if bp_trend.systolic_trend.is_concerning:
            concerning.append(bp_trend.systolic_trend)

        # آیا بیمار به طور کلی در حال بدتر شدن است؟
        overall_deteriorating = len(concerning) >= 2

        # خلاصه فارسی
        summary_parts = []
        if concerning:
            names = [t.test_name_fa for t in concerning[:3]]
            summary_parts.append(
                f"روند نگران‌کننده در: {', '.join(names)}"
            )
        if bp_trend.idh_frequency >= 30:
            summary_parts.append(
                f"IDH در {bp_trend.idh_frequency:.0f}% جلسات"
            )

        summary_fa = (
            " | ".join(summary_parts)
            if summary_parts
            else "وضعیت پایدار — بدون روند نگران‌کننده"
        )

        return PatientTrendSummary(
            patient_id=str(patient_id),
            analyzed_at=analyzed_at,
            lab_trends=lab_trends,
            weight_trend=weight_trend,
            bp_trend=bp_trend,
            concerning_trends=concerning,
            overall_deteriorating=overall_deteriorating,
            summary_fa=summary_fa,
        )


# Singleton
trend_analyzer = TrendAnalyzer()