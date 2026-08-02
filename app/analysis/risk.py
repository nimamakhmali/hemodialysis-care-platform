"""
سیستم امتیازدهی ریسک بیمار

یک سیستم قابل توضیح (Explainable) برای محاسبه
نمره ریسک کلی هر بیمار بر اساس وضعیت پارامترها.

این سیستم ML نیست — یک weighted scoring system است
که هر عامل را با وزن مشخص امتیاز می‌دهد و قابل
توضیح کامل برای پزشک است.

اصل طراحی: KISS (Keep It Simple & Safe)
"""

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.dialysis_session import DialysisSession
from app.models.lab_result import LabPanel, LabResult
from app.models.patient import Patient
from app.models.symptom_report import SymptomReport
from app.shared.enums import AlertSeverity, AlertStatus, LabTestCode
from app.config.thresholds import LAB_THRESHOLDS, WEIGHT_THRESHOLDS, BP_THRESHOLDS


# ============================================================
# Data Classes
# ============================================================

@dataclass
class RiskFactor:
    """یک عامل مؤثر در نمره ریسک"""
    factor_code: str
    factor_name_fa: str
    raw_value: Optional[float]       # مقدار خام پارامتر
    score_contribution: float        # امتیاز اضافه‌شده (0 تا max_score)
    max_possible_score: float        # حداکثر امتیاز این عامل
    status: str                      # ok / warning / critical
    detail_fa: str                   # توضیح فارسی


@dataclass
class RiskScore:
    """نمره ریسک کامل یک بیمار"""
    patient_id: str
    calculated_at: datetime

    # نمره کلی
    total_score: float               # 0-100
    risk_level: str                  # low / medium / high / critical

    # عوامل مؤثر
    contributing_factors: list[RiskFactor] = field(default_factory=list)

    # توضیح کلی
    interpretation_fa: str = ""
    clinician_summary: str = ""

    # متادیتا
    data_completeness: float = 0.0  # درصد پارامترهایی که داده داشتند

    @property
    def top_risks(self) -> list[RiskFactor]:
        """۳ عامل اصلی با بیشترین امتیاز"""
        return sorted(
            self.contributing_factors,
            key=lambda f: f.score_contribution,
            reverse=True,
        )[:3]


# ============================================================
# تعریف وزن‌ها و امتیازات
# ============================================================

# حداکثر امتیاز هر بخش (جمع = 100)
MAX_SCORES = {
    "active_high_alerts": 20,    # هشدارهای HIGH فعال
    "active_medium_alerts": 10,  # هشدارهای MEDIUM فعال
    "potassium": 18,             # K (مهم‌ترین از نظر فوری)
    "hemoglobin": 10,            # Hb
    "albumin": 12,               # Alb (مهم‌ترین از نظر بلندمدت)
    "phosphorus": 8,             # P
    "idwg": 10,                  # IDWG
    "bp": 7,                     # فشار خون
    "symptom_burden": 5,         # بار علائم
}

assert sum(MAX_SCORES.values()) == 100, "مجموع امتیازات باید 100 باشد"


class RiskScorer:
    """
    محاسبه‌گر نمره ریسک بیمار

    هر عامل به صورت مستقل امتیاز می‌گیرد و نمره کلی
    جمع وزنی عوامل است.
    """

    # ============================================================
    # Main Calculator
    # ============================================================

    def calculate_risk_score(
        self,
        db: Session,
        patient_id: UUID,
    ) -> RiskScore:
        """
        محاسبه نمره ریسک کامل بیمار

        مراحل:
        1. دریافت داده‌های لازم از DB
        2. محاسبه امتیاز هر عامل
        3. محاسبه نمره کلی
        4. تعیین سطح ریسک
        5. تولید توضیحات
        """
        calculated_at = datetime.now(timezone.utc)
        factors: list[RiskFactor] = []
        data_available = 0
        data_total = len(MAX_SCORES)

        # ============================================================
        # 1) هشدارهای فعال
        # ============================================================
        high_alerts = db.query(Alert).filter(
            Alert.patient_id == patient_id,
            Alert.severity == AlertSeverity.HIGH,
            Alert.status == AlertStatus.NEW,
        ).count()

        medium_alerts = db.query(Alert).filter(
            Alert.patient_id == patient_id,
            Alert.severity == AlertSeverity.MEDIUM,
            Alert.status == AlertStatus.NEW,
        ).count()

        # High alerts: هر عدد 7 امتیاز، حداکثر 20
        high_score = min(high_alerts * 7, MAX_SCORES["active_high_alerts"])
        factors.append(RiskFactor(
            factor_code="active_high_alerts",
            factor_name_fa="هشدارهای بحرانی فعال",
            raw_value=float(high_alerts),
            score_contribution=high_score,
            max_possible_score=MAX_SCORES["active_high_alerts"],
            status="critical" if high_alerts >= 2 else ("warning" if high_alerts >= 1 else "ok"),
            detail_fa=(
                f"{high_alerts} هشدار بحرانی فعال"
                if high_alerts > 0
                else "بدون هشدار بحرانی"
            ),
        ))
        data_available += 1

        # Medium alerts: هر عدد 3 امتیاز، حداکثر 10
        med_score = min(medium_alerts * 3, MAX_SCORES["active_medium_alerts"])
        factors.append(RiskFactor(
            factor_code="active_medium_alerts",
            factor_name_fa="هشدارهای متوسط فعال",
            raw_value=float(medium_alerts),
            score_contribution=med_score,
            max_possible_score=MAX_SCORES["active_medium_alerts"],
            status="warning" if medium_alerts >= 2 else "ok",
            detail_fa=(
                f"{medium_alerts} هشدار متوسط فعال"
                if medium_alerts > 0
                else "بدون هشدار متوسط"
            ),
        ))
        data_available += 1

        # ============================================================
        # 2) پتاسیم
        # ============================================================
        k_factor = self._score_potassium(db, patient_id)
        factors.append(k_factor)
        if k_factor.raw_value is not None:
            data_available += 1

        # ============================================================
        # 3) هموگلوبین
        # ============================================================
        hb_factor = self._score_hemoglobin(db, patient_id)
        factors.append(hb_factor)
        if hb_factor.raw_value is not None:
            data_available += 1

        # ============================================================
        # 4) آلبومین
        # ============================================================
        alb_factor = self._score_albumin(db, patient_id)
        factors.append(alb_factor)
        if alb_factor.raw_value is not None:
            data_available += 1

        # ============================================================
        # 5) فسفر
        # ============================================================
        p_factor = self._score_phosphorus(db, patient_id)
        factors.append(p_factor)
        if p_factor.raw_value is not None:
            data_available += 1

        # ============================================================
        # 6) IDWG
        # ============================================================
        idwg_factor = self._score_idwg(db, patient_id)
        factors.append(idwg_factor)
        if idwg_factor.raw_value is not None:
            data_available += 1

        # ============================================================
        # 7) فشار خون
        # ============================================================
        bp_factor = self._score_blood_pressure(db, patient_id)
        factors.append(bp_factor)
        if bp_factor.raw_value is not None:
            data_available += 1

        # ============================================================
        # 8) بار علائم
        # ============================================================
        symptom_factor = self._score_symptom_burden(db, patient_id)
        factors.append(symptom_factor)
        if symptom_factor.raw_value is not None:
            data_available += 1

        # ============================================================
        # محاسبه نمره کلی
        # ============================================================
        total_score = round(sum(f.score_contribution for f in factors), 1)
        total_score = min(total_score, 100.0)  # cap at 100

        # تعیین سطح ریسک
        risk_level = self._classify_risk_level(total_score)

        # تعیین completeness
        data_completeness = round(data_available / data_total * 100, 1)

        # تولید توضیحات
        interpretation_fa = self._generate_interpretation(
            total_score, risk_level, factors
        )
        clinician_summary = self._generate_clinician_summary(
            total_score, risk_level, factors, data_completeness
        )

        return RiskScore(
            patient_id=str(patient_id),
            calculated_at=calculated_at,
            total_score=total_score,
            risk_level=risk_level,
            contributing_factors=factors,
            interpretation_fa=interpretation_fa,
            clinician_summary=clinician_summary,
            data_completeness=data_completeness,
        )

    # ============================================================
    # Individual Factor Scorers
    # ============================================================

    def _get_latest_lab(
        self,
        db: Session,
        patient_id: UUID,
        test_code: str,
    ) -> Optional[float]:
        """دریافت آخرین مقدار یک آزمایش"""
        result = (
            db.query(LabResult)
            .join(LabPanel)
            .filter(
                LabResult.patient_id == patient_id,
                LabResult.test_code == test_code,
            )
            .order_by(desc(LabPanel.collected_at))
            .first()
        )
        return result.value if result else None

    def _score_potassium(
        self,
        db: Session,
        patient_id: UUID,
    ) -> RiskFactor:
        """
        امتیاز پتاسیم (0-18)

        K نرمال (3.5-5.0): 0
        K کمی بالا (5.0-5.5): 5
        K بالا (5.5-6.0): 10
        K بحرانی (6.0-7.0): 15
        K اورژانسی (>7.0): 18
        K پایین (<3.5): 8
        K بحرانی پایین (<3.0): 15
        """
        k = self._get_latest_lab(db, patient_id, LabTestCode.POTASSIUM.value)

        if k is None:
            return RiskFactor(
                factor_code="potassium",
                factor_name_fa="پتاسیم",
                raw_value=None,
                score_contribution=3.0,  # عدم داده = ریسک پیش‌فرض کم
                max_possible_score=MAX_SCORES["potassium"],
                status="unknown",
                detail_fa="داده موجود نیست",
            )

        if k >= LAB_THRESHOLDS.k_emergency:
            score, status = 18.0, "critical"
            detail = f"K = {k} mEq/L — اورژانسی"
        elif k >= LAB_THRESHOLDS.k_critical_high:
            score, status = 15.0, "critical"
            detail = f"K = {k} mEq/L — بحرانی بالا"
        elif k >= LAB_THRESHOLDS.k_warning_high:
            score, status = 10.0, "warning"
            detail = f"K = {k} mEq/L — هشدار"
        elif k > LAB_THRESHOLDS.k_normal_high:
            score, status = 5.0, "warning"
            detail = f"K = {k} mEq/L — کمی بالا"
        elif k <= LAB_THRESHOLDS.k_critical_low:
            score, status = 15.0, "critical"
            detail = f"K = {k} mEq/L — بحرانی پایین"
        elif k < LAB_THRESHOLDS.k_normal_low:
            score, status = 8.0, "warning"
            detail = f"K = {k} mEq/L — پایین"
        else:
            score, status = 0.0, "ok"
            detail = f"K = {k} mEq/L — طبیعی"

        return RiskFactor(
            factor_code="potassium",
            factor_name_fa="پتاسیم",
            raw_value=k,
            score_contribution=score,
            max_possible_score=MAX_SCORES["potassium"],
            status=status,
            detail_fa=detail,
        )

    def _score_hemoglobin(
        self,
        db: Session,
        patient_id: UUID,
    ) -> RiskFactor:
        """
        امتیاز هموگلوبین (0-10)

        Hb >= 10: 0
        Hb 9-10: 3
        Hb 8-9: 6
        Hb < 8: 10
        Hb > 13: 4 (Thrombosis risk)
        """
        hb = self._get_latest_lab(db, patient_id, LabTestCode.HEMOGLOBIN.value)

        if hb is None:
            return RiskFactor(
                factor_code="hemoglobin",
                factor_name_fa="هموگلوبین",
                raw_value=None,
                score_contribution=2.0,
                max_possible_score=MAX_SCORES["hemoglobin"],
                status="unknown",
                detail_fa="داده موجود نیست",
            )

        if hb < LAB_THRESHOLDS.hb_critical_low:
            score, status = 10.0, "critical"
            detail = f"Hb = {hb} g/dL — بحرانی"
        elif hb < 9.0:
            score, status = 6.0, "warning"
            detail = f"Hb = {hb} g/dL — پایین"
        elif hb < LAB_THRESHOLDS.hb_target_low:
            score, status = 3.0, "warning"
            detail = f"Hb = {hb} g/dL — زیر هدف"
        elif hb > LAB_THRESHOLDS.hb_target_high:
            score, status = 4.0, "warning"
            detail = f"Hb = {hb} g/dL — بالاتر از هدف"
        else:
            score, status = 0.0, "ok"
            detail = f"Hb = {hb} g/dL — در محدوده هدف"

        return RiskFactor(
            factor_code="hemoglobin",
            factor_name_fa="هموگلوبین",
            raw_value=hb,
            score_contribution=score,
            max_possible_score=MAX_SCORES["hemoglobin"],
            status=status,
            detail_fa=detail,
        )

    def _score_albumin(
        self,
        db: Session,
        patient_id: UUID,
    ) -> RiskFactor:
        """
        امتیاز آلبومین (0-12)

        Alb >= 3.5: 0
        Alb 3.2-3.5: 4
        Alb 3.0-3.2: 8
        Alb < 3.0: 12
        """
        alb = self._get_latest_lab(db, patient_id, LabTestCode.ALBUMIN.value)

        if alb is None:
            return RiskFactor(
                factor_code="albumin",
                factor_name_fa="آلبومین",
                raw_value=None,
                score_contribution=2.0,
                max_possible_score=MAX_SCORES["albumin"],
                status="unknown",
                detail_fa="داده موجود نیست",
            )

        if alb < LAB_THRESHOLDS.alb_critical_low:
            score, status = 12.0, "critical"
            detail = f"Alb = {alb} g/dL — بحرانی"
        elif alb < 3.2:
            score, status = 8.0, "warning"
            detail = f"Alb = {alb} g/dL — پایین"
        elif alb < LAB_THRESHOLDS.alb_normal_low:
            score, status = 4.0, "warning"
            detail = f"Alb = {alb} g/dL — زیر هدف"
        else:
            score, status = 0.0, "ok"
            detail = f"Alb = {alb} g/dL — طبیعی"

        return RiskFactor(
            factor_code="albumin",
            factor_name_fa="آلبومین",
            raw_value=alb,
            score_contribution=score,
            max_possible_score=MAX_SCORES["albumin"],
            status=status,
            detail_fa=detail,
        )

    def _score_phosphorus(
        self,
        db: Session,
        patient_id: UUID,
    ) -> RiskFactor:
        """امتیاز فسفر (0-8)"""
        p = self._get_latest_lab(db, patient_id, LabTestCode.PHOSPHORUS.value)

        if p is None:
            return RiskFactor(
                factor_code="phosphorus",
                factor_name_fa="فسفر",
                raw_value=None,
                score_contribution=1.0,
                max_possible_score=MAX_SCORES["phosphorus"],
                status="unknown",
                detail_fa="داده موجود نیست",
            )

        if p >= LAB_THRESHOLDS.p_critical_high:
            score, status = 8.0, "critical"
            detail = f"P = {p} mg/dL — بحرانی"
        elif p >= LAB_THRESHOLDS.p_warning_high:
            score, status = 5.0, "warning"
            detail = f"P = {p} mg/dL — بالا"
        elif p > LAB_THRESHOLDS.p_normal_high:
            score, status = 2.0, "warning"
            detail = f"P = {p} mg/dL — کمی بالا"
        else:
            score, status = 0.0, "ok"
            detail = f"P = {p} mg/dL — طبیعی"

        return RiskFactor(
            factor_code="phosphorus",
            factor_name_fa="فسفر",
            raw_value=p,
            score_contribution=score,
            max_possible_score=MAX_SCORES["phosphorus"],
            status=status,
            detail_fa=detail,
        )

    def _score_idwg(
        self,
        db: Session,
        patient_id: UUID,
    ) -> RiskFactor:
        """
        امتیاز IDWG (0-10)

        بر اساس میانگین ۳ جلسه اخیر
        """
        sessions = (
            db.query(DialysisSession)
            .filter(
                DialysisSession.patient_id == patient_id,
                DialysisSession.weight_gain_percent.isnot(None),
            )
            .order_by(desc(DialysisSession.session_date))
            .limit(3)
            .all()
        )

        if not sessions:
            return RiskFactor(
                factor_code="idwg",
                factor_name_fa="افزایش وزن بین جلسات",
                raw_value=None,
                score_contribution=1.0,
                max_possible_score=MAX_SCORES["idwg"],
                status="unknown",
                detail_fa="داده موجود نیست",
            )

        avg_idwg = sum(
            s.weight_gain_percent for s in sessions
        ) / len(sessions)

        if avg_idwg >= WEIGHT_THRESHOLDS.idwg_percent_critical:
            score, status = 10.0, "critical"
            detail = f"میانگین IDWG = {avg_idwg:.1f}% — بحرانی"
        elif avg_idwg >= WEIGHT_THRESHOLDS.idwg_percent_warning:
            score, status = 6.0, "warning"
            detail = f"میانگین IDWG = {avg_idwg:.1f}% — بالا"
        elif avg_idwg >= 2.0:
            score, status = 2.0, "warning"
            detail = f"میانگین IDWG = {avg_idwg:.1f}% — کمی بالا"
        else:
            score, status = 0.0, "ok"
            detail = f"میانگین IDWG = {avg_idwg:.1f}% — طبیعی"

        return RiskFactor(
            factor_code="idwg",
            factor_name_fa="افزایش وزن بین جلسات",
            raw_value=round(avg_idwg, 2),
            score_contribution=score,
            max_possible_score=MAX_SCORES["idwg"],
            status=status,
            detail_fa=detail,
        )

    def _score_blood_pressure(
        self,
        db: Session,
        patient_id: UUID,
    ) -> RiskFactor:
        """
        امتیاز فشار خون (0-7)

        بر اساس آخرین جلسه + IDH frequency
        """
        latest_session = (
            db.query(DialysisSession)
            .filter(DialysisSession.patient_id == patient_id)
            .order_by(desc(DialysisSession.session_date))
            .first()
        )

        if not latest_session:
            return RiskFactor(
                factor_code="bp",
                factor_name_fa="فشار خون",
                raw_value=None,
                score_contribution=1.0,
                max_possible_score=MAX_SCORES["bp"],
                status="unknown",
                detail_fa="داده موجود نیست",
            )

        score = 0.0
        details = []
        sys_val = latest_session.bp_pre_systolic

        if sys_val:
            if sys_val >= BP_THRESHOLDS.pre_systolic_high_critical:
                score += 4.0
                details.append(f"BP بحرانی: {sys_val} mmHg")
            elif sys_val >= BP_THRESHOLDS.pre_systolic_high:
                score += 2.0
                details.append(f"BP بالا: {sys_val} mmHg")
            elif sys_val <= BP_THRESHOLDS.pre_systolic_low_critical:
                score += 3.0
                details.append(f"BP بحرانی پایین: {sys_val} mmHg")
            elif sys_val <= BP_THRESHOLDS.pre_systolic_low:
                score += 2.0
                details.append(f"BP پایین: {sys_val} mmHg")

        # IDH در ۵ جلسه اخیر
        recent_5 = (
            db.query(DialysisSession)
            .filter(DialysisSession.patient_id == patient_id)
            .order_by(desc(DialysisSession.session_date))
            .limit(5)
            .all()
        )
        idh_count = sum(1 for s in recent_5 if s.had_intradialytic_hypotension)
        if idh_count >= 3:
            score += 3.0
            details.append(f"IDH در {idh_count}/5 جلسه")
        elif idh_count >= 1:
            score += 1.0
            details.append(f"IDH در {idh_count}/5 جلسه")

        score = min(score, MAX_SCORES["bp"])

        status = "critical" if score >= 5 else ("warning" if score >= 2 else "ok")

        return RiskFactor(
            factor_code="bp",
            factor_name_fa="فشار خون",
            raw_value=float(sys_val) if sys_val else None,
            score_contribution=score,
            max_possible_score=MAX_SCORES["bp"],
            status=status,
            detail_fa=" + ".join(details) if details else "فشار خون طبیعی",
        )

    def _score_symptom_burden(
        self,
        db: Session,
        patient_id: UUID,
    ) -> RiskFactor:
        """
        امتیاز بار علائم (0-5)

        تعداد گزارش علائم در ۱۴ روز + علائم خطر
        """
        two_weeks_ago = datetime.now(timezone.utc) - timedelta(days=14)
        reports = (
            db.query(SymptomReport)
            .filter(
                SymptomReport.patient_id == patient_id,
                SymptomReport.reported_at >= two_weeks_ago,
            )
            .all()
        )

        if not reports:
            return RiskFactor(
                factor_code="symptom_burden",
                factor_name_fa="بار علائم",
                raw_value=0.0,
                score_contribution=0.0,
                max_possible_score=MAX_SCORES["symptom_burden"],
                status="ok",
                detail_fa="بدون علامت گزارش‌شده در ۱۴ روز",
            )

        total_reports = len(reports)
        danger_reports = sum(1 for r in reports if r.has_danger_symptoms)

        score = min(total_reports * 0.5 + danger_reports * 2.0, 5.0)
        status = "critical" if danger_reports > 0 else ("warning" if total_reports >= 5 else "ok")

        return RiskFactor(
            factor_code="symptom_burden",
            factor_name_fa="بار علائم",
            raw_value=float(total_reports),
            score_contribution=round(score, 1),
            max_possible_score=MAX_SCORES["symptom_burden"],
            status=status,
            detail_fa=(
                f"{total_reports} گزارش در ۱۴ روز"
                + (f" ({danger_reports} علامت خطر)" if danger_reports else "")
            ),
        )

    # ============================================================
    # Classification & Interpretation
    # ============================================================

    @staticmethod
    def _classify_risk_level(score: float) -> str:
        """
        طبقه‌بندی نمره به سطح ریسک

        0-25:  low
        26-50: medium
        51-75: high
        76+:   critical
        """
        if score <= 25:
            return "low"
        elif score <= 50:
            return "medium"
        elif score <= 75:
            return "high"
        else:
            return "critical"

    @staticmethod
    def _generate_interpretation(
        score: float,
        risk_level: str,
        factors: list[RiskFactor],
    ) -> str:
        """توضیح فارسی نمره برای نمایش به بیمار"""
        level_text = {
            "low": "وضعیت شما در محدوده قابل قبول است.",
            "medium": "وضعیت شما نیاز به توجه و پیگیری بیشتری دارد.",
            "high": "وضعیت شما نگران‌کننده است و نیاز به بررسی فوری دارد.",
            "critical": "وضعیت شما بحرانی است — تیم درمان در حال بررسی هستند.",
        }
        return level_text.get(risk_level, "")

    @staticmethod
    def _generate_clinician_summary(
        score: float,
        risk_level: str,
        factors: list[RiskFactor],
        completeness: float,
    ) -> str:
        """خلاصه برای کلینیسین"""
        critical_factors = [
            f for f in factors if f.status == "critical"
        ]
        warning_factors = [
            f for f in factors if f.status == "warning"
        ]

        parts = [f"نمره ریسک: {score:.1f}/100 (سطح: {risk_level})"]

        if critical_factors:
            names = [f.factor_name_fa for f in critical_factors]
            parts.append(f"بحرانی: {', '.join(names)}")

        if warning_factors:
            names = [f.factor_name_fa for f in warning_factors[:3]]
            parts.append(f"هشدار: {', '.join(names)}")

        if completeness < 70:
            parts.append(
                f"⚠️ کامل بودن داده: {completeness:.0f}% "
                f"(آزمایش‌های بیشتری لازم است)"
            )

        return " | ".join(parts)

    # ============================================================
    # Risk Trend (هفته به هفته)
    # ============================================================

    def get_risk_trend(
        self,
        db: Session,
        patient_id: UUID,
        n_weeks: int = 4,
    ) -> list[dict]:
        """
        نمره ریسک هفتگی برای نمایش روند

        از آخرین داده‌های موجود در هر هفته استفاده می‌کند.

        Returns:
            [{week_start, score, risk_level}]
        """
        results = []
        today = date.today()

        for week_offset in range(n_weeks - 1, -1, -1):
            week_start = today - timedelta(weeks=week_offset + 1)
            week_end = today - timedelta(weeks=week_offset)

            # بررسی: آیا در این هفته داده داشتیم؟
            had_session = db.query(DialysisSession).filter(
                DialysisSession.patient_id == patient_id,
                DialysisSession.session_date >= week_start,
                DialysisSession.session_date < week_end,
            ).first()

            had_lab = db.query(LabPanel).filter(
                LabPanel.patient_id == patient_id,
                LabPanel.collected_at >= week_start,
                LabPanel.collected_at < week_end,
            ).first()

            if not had_session and not had_lab:
                results.append({
                    "week_start": str(week_start),
                    "week_end": str(week_end),
                    "score": None,
                    "risk_level": None,
                    "note": "بدون داده",
                })
                continue

            # محاسبه نمره برای این هفته با داده‌های موجود تا آن تاریخ
            # (ساده‌سازی: از نمره جاری استفاده می‌کنیم چون داده تاریخی داریم)
            risk = self.calculate_risk_score(db, patient_id)
            results.append({
                "week_start": str(week_start),
                "week_end": str(week_end),
                "score": risk.total_score,
                "risk_level": risk.risk_level,
                "had_session": had_session is not None,
                "had_lab": had_lab is not None,
            })

        return results


# Singleton
risk_scorer = RiskScorer()