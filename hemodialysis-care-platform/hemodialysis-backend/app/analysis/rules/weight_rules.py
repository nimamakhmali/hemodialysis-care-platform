"""
قوانین تحلیل وزن و IDWG

IDWG (Interdialytic Weight Gain):
- بزرگترین شاخص رعایت محدودیت مایعات
- مستقیماً با ریسک ادم ریوی، فشار خون و Cardiac Stress مرتبط است
- KDOQI: هدف IDWG < 4.5% وزن خشک

منابع:
- KDOQI Clinical Practice Guidelines (2015)
- European Renal Best Practice (ERBP) Guidelines
- NKF-KDOQI Hemodialysis Adequacy
"""

from app.analysis.rules.base import BaseRule, RuleContext, RuleResult
from app.config.thresholds import WEIGHT_THRESHOLDS
from app.shared.enums import AlertCategory, AlertSeverity


class IDWGWarningRule(BaseRule):
    """
    IDWG در محدوده هشدار (3% تا 5% وزن خشک)

    Trigger: IDWG بین 3% و 5% وزن خشک
    Severity: MEDIUM
    Action: آموزش کنترل مایعات + بررسی وزن خشک
    """
    name = "IDWG_WARNING"
    category = AlertCategory.WEIGHT

    def evaluate(self, context: RuleContext) -> RuleResult:
        session = context.current_session
        if not session:
            return self._no_trigger()

        idwg_percent = session.get("weight_gain_percent")
        if idwg_percent is None:
            return self._no_trigger()

        threshold_warn = WEIGHT_THRESHOLDS.idwg_percent_warning
        threshold_critical = WEIGHT_THRESHOLDS.idwg_percent_critical

        if threshold_warn <= idwg_percent < threshold_critical:
            weight_gain = session.get("weight_gain", 0)
            dry_weight = session.get("dry_weight", context.dry_weight)

            return self._make_triggered(
                severity=AlertSeverity.MEDIUM,
                title=f"افزایش وزن بین جلسات: {idwg_percent:.1f}%",
                clinician_explanation=(
                    f"IDWG = {idwg_percent:.1f}% (معادل {weight_gain:.1f} kg) "
                    f"از وزن خشک {dry_weight} kg. "
                    f"بازه هشدار: {threshold_warn}% - {threshold_critical}%. "
                    f"بررسی میزان مصرف مایعات و صحت وزن خشک توصیه می‌شود."
                ),
                evidence={
                    "idwg_percent": idwg_percent,
                    "weight_gain_kg": weight_gain,
                    "pre_weight": session.get("pre_weight"),
                    "dry_weight": dry_weight,
                    "session_date": session.get("date"),
                    "threshold_warn": threshold_warn,
                },
                education_topic="HIGH_IDWG",
                recommendation_draft=(
                    f"📋 بررسی IDWG بالا — {context.patient_full_name}\n\n"
                    f"مشاهدات: IDWG = {idwg_percent:.1f}% ({weight_gain:.1f} kg)\n"
                    f"وضعیت: هشدار (محدوده {threshold_warn}%-{threshold_critical}%)\n\n"
                    f"پیشنهاد بررسی:\n"
                    f"• مرور گزارش مصرف مایعات بیمار در روزهای اخیر\n"
                    f"• ارزیابی صحت وزن خشک فعلی ({dry_weight} kg)\n"
                    f"• بررسی رعایت محدودیت سدیم (کاهش تشنگی)\n"
                    f"• در صورت نیاز، تنظیم وزن خشک"
                ),
                patient_message_draft=(
                    f"وزن شما قبل از جلسه دیالیز {weight_gain:.1f} کیلوگرم "
                    f"بیشتر از وزن هدف بود. "
                    f"این اضافه وزن نشان‌دهنده مایعات اضافی در بدن است. "
                    f"لطفاً محدودیت مصرف مایعات را جدی‌تر رعایت کنید."
                ),
            )

        return self._no_trigger()


class IDWGCriticalRule(BaseRule):
    """
    IDWG بیش از ۵% وزن خشک — بحرانی

    Trigger: IDWG >= 5% وزن خشک
    Severity: HIGH
    Risk: ادم ریوی، Cardiac Stress، Hypertension اورژانسی
    """
    name = "IDWG_CRITICAL"
    category = AlertCategory.WEIGHT

    def evaluate(self, context: RuleContext) -> RuleResult:
        session = context.current_session
        if not session:
            return self._no_trigger()

        idwg_percent = session.get("weight_gain_percent")
        if idwg_percent is None:
            return self._no_trigger()

        if idwg_percent >= WEIGHT_THRESHOLDS.idwg_percent_critical:
            weight_gain = session.get("weight_gain", 0)
            dry_weight = session.get("dry_weight", context.dry_weight)
            uf_volume = session.get("uf_volume")

            uf_note = (
                f"UF Volume لازم: {uf_volume:.1f} L"
                if uf_volume else "UF Volume هنوز ثبت نشده"
            )

            return self._make_triggered(
                severity=AlertSeverity.HIGH,
                title=f"⚠️ IDWG بحرانی: {idwg_percent:.1f}%",
                clinician_explanation=(
                    f"IDWG = {idwg_percent:.1f}% ({weight_gain:.1f} kg) "
                    f"از وزن خشک {dry_weight} kg — بالاتر از حد بحرانی "
                    f"({WEIGHT_THRESHOLDS.idwg_percent_critical}%). "
                    f"{uf_note}. "
                    f"ریسک: ادم ریوی، Cardiac Stress، Hypertensive Crisis. "
                    f"بررسی UF Rate و تحمل بیمار ضروری است."
                ),
                evidence={
                    "idwg_percent": idwg_percent,
                    "weight_gain_kg": weight_gain,
                    "pre_weight": session.get("pre_weight"),
                    "dry_weight": dry_weight,
                    "uf_volume": uf_volume,
                    "session_date": session.get("date"),
                    "threshold_critical": WEIGHT_THRESHOLDS.idwg_percent_critical,
                },
                education_topic="HIGH_IDWG",
                recommendation_draft=(
                    f"🚨 IDWG بحرانی — {context.patient_full_name}\n\n"
                    f"مشاهدات: IDWG = {idwg_percent:.1f}% ({weight_gain:.1f} kg)\n"
                    f"وضعیت: بحرانی (> {WEIGHT_THRESHOLDS.idwg_percent_critical}%)\n\n"
                    f"پیشنهاد اقدام:\n"
                    f"• بررسی فوری وضعیت تنفسی و ادم بیمار\n"
                    f"• ارزیابی UF Rate قابل تحمل برای این جلسه\n"
                    f"• بررسی علت افزایش وزن (رعایت مایعات، وزن خشک)\n"
                    f"• آموزش فوری محدودیت مایعات\n"
                    f"• در صورت علائم تنفسی: بررسی نیاز به اورژانس"
                ),
                patient_message_draft=(
                    f"⚠️ توجه: وزن شما قبل از دیالیز {weight_gain:.1f} کیلوگرم "
                    f"بیشتر از وزن هدف بود. "
                    f"این مقدار بیشتر از حد ایمن است و می‌تواند به قلب و ریه آسیب بزند. "
                    f"تیم درمان شما مطلع هستند. "
                    f"لطفاً محدودیت مایعات را کاملاً رعایت کنید."
                ),
            )

        return self._no_trigger()


# ============================================================
# app/analysis/rules/weight_rules.py — فقط ConsecutiveHighIDWGRule اصلاح شد
# ============================================================

class ConsecutiveHighIDWGRule(BaseRule):
    name = "IDWG_CONSECUTIVE_HIGH"
    category = AlertCategory.WEIGHT
    CONSECUTIVE_COUNT = 3

    def evaluate(self, context: RuleContext) -> RuleResult:
        if len(context.recent_sessions) < self.CONSECUTIVE_COUNT:
            return self._no_trigger()

        threshold = WEIGHT_THRESHOLDS.idwg_percent_warning

        # n جلسه آخر (جدیدترین اول در recent_sessions)
        recent_n = context.recent_sessions[:self.CONSECUTIVE_COUNT]

        # بررسی همه باید بالا باشند
        high_idwg_sessions = []
        for s in recent_n:
            idwg = s.get("weight_gain_percent")
            if idwg is not None and idwg >= threshold:
                high_idwg_sessions.append({
                    "date": s.get("date"),
                    "idwg_percent": idwg,
                    "weight_gain_kg": s.get("weight_gain"),
                })
            else:
                return self._no_trigger()

        if len(high_idwg_sessions) < self.CONSECUTIVE_COUNT:
            return self._no_trigger()

        avg_idwg = sum(
            s["idwg_percent"] for s in high_idwg_sessions
        ) / len(high_idwg_sessions)

        return self._make_triggered(
            severity=AlertSeverity.HIGH,
            title=f"IDWG بالا در {self.CONSECUTIVE_COUNT} جلسه متوالی",
            clinician_explanation=(
                f"در {self.CONSECUTIVE_COUNT} جلسه متوالی اخیر، "
                f"IDWG بیشتر از {threshold}% بوده است. "
                f"میانگین IDWG: {avg_idwg:.1f}%."
            ),
            evidence={
                "consecutive_sessions": high_idwg_sessions,
                "count": self.CONSECUTIVE_COUNT,
                "avg_idwg_percent": round(avg_idwg, 1),
                "threshold": threshold,
            },
            education_topic="HIGH_IDWG",
            recommendation_draft=(
                f"📋 IDWG مستمر بالا — {context.patient_full_name}\n\n"
                f"میانگین IDWG: {avg_idwg:.1f}% در "
                f"{self.CONSECUTIVE_COUNT} جلسه متوالی\n\n"
                f"پیشنهاد بررسی:\n"
                f"• جلسه آموزشی مجدد درباره محدودیت مایعات\n"
                f"• بررسی مصرف سدیم\n"
                f"• ارزیابی صحت وزن خشک"
            ),
            patient_message_draft=(
                f"در چند جلسه اخیر وزن شما مرتباً بالاتر از حد توصیه‌شده بوده. "
                f"پزشک شما راهنمایی بیشتری خواهد داد."
            ),
        )

class PostWeightFarFromDryRule(BaseRule):
    """
    وزن بعد از دیالیز خیلی دور از وزن خشک

    دو حالت:
    1. post_weight >> dry_weight: Fluid Overload باقی‌مانده
    2. post_weight << dry_weight: Over-ultrafiltration (خطر)
    """
    name = "POST_WEIGHT_DRY_WEIGHT_GAP"
    category = AlertCategory.WEIGHT

    # حداکثر اختلاف قابل قبول (kg)
    MAX_ABOVE_DRY = 2.0   # بیشتر از این: احتمال Fluid Overload
    MAX_BELOW_DRY = 1.5   # کمتر از این: احتمال Over-UF

    def evaluate(self, context: RuleContext) -> RuleResult:
        session = context.current_session
        if not session:
            return self._no_trigger()

        post_weight = session.get("post_weight")
        if post_weight is None:
            return self._no_trigger()

        dry_weight = session.get("dry_weight", context.dry_weight)
        gap = post_weight - dry_weight

        if gap > self.MAX_ABOVE_DRY:
            return self._make_triggered(
                severity=AlertSeverity.MEDIUM,
                title=(
                    f"وزن بعد دیالیز {gap:.1f} kg بالاتر از وزن خشک"
                ),
                clinician_explanation=(
                    f"وزن بعد از دیالیز ({post_weight} kg) هنوز {gap:.1f} kg "
                    f"بالاتر از وزن خشک ({dry_weight} kg) است. "
                    f"احتمال Fluid Overload باقی‌مانده. "
                    f"بررسی وزن خشک یا UF ناکافی توصیه می‌شود."
                ),
                evidence={
                    "post_weight": post_weight,
                    "dry_weight": dry_weight,
                    "gap_kg": round(gap, 2),
                    "session_date": session.get("date"),
                },
                education_topic="HIGH_IDWG",
                recommendation_draft=(
                    f"📋 Fluid Overload پس از دیالیز — "
                    f"{context.patient_full_name}\n\n"
                    f"مشاهدات: وزن پس از دیالیز {gap:.1f} kg "
                    f"بالاتر از وزن خشک\n\n"
                    f"پیشنهاد بررسی:\n"
                    f"• آیا UF کافی بوده؟ (بررسی UF volume)\n"
                    f"• آیا وزن خشک نیاز به تجدیدنظر دارد؟\n"
                    f"• بررسی تحمل UF در این جلسه (IDH، کرامپ)\n"
                    f"• بررسی وضعیت ادم"
                ),
            )

        if gap < -self.MAX_BELOW_DRY:
            return self._make_triggered(
                severity=AlertSeverity.MEDIUM,
                title=(
                    f"وزن بعد دیالیز {abs(gap):.1f} kg پایین‌تر از وزن خشک"
                ),
                clinician_explanation=(
                    f"وزن بعد از دیالیز ({post_weight} kg) {abs(gap):.1f} kg "
                    f"کمتر از وزن خشک ({dry_weight} kg) است. "
                    f"Over-ultrafiltration محتمل است. "
                    f"بررسی علائم Hypovolemia (افت فشار، کرامپ، سرگیجه) "
                    f"و تجدیدنظر در وزن خشک توصیه می‌شود."
                ),
                evidence={
                    "post_weight": post_weight,
                    "dry_weight": dry_weight,
                    "gap_kg": round(gap, 2),
                    "session_date": session.get("date"),
                },
                recommendation_draft=(
                    f"📋 Over-ultrafiltration — {context.patient_full_name}\n\n"
                    f"مشاهدات: وزن پس از دیالیز {abs(gap):.1f} kg "
                    f"زیر وزن خشک\n\n"
                    f"پیشنهاد بررسی:\n"
                    f"• بررسی علائم Hypovolemia در بیمار\n"
                    f"• تجدیدنظر در وزن خشک (احتمالاً باید کاهش یابد)\n"
                    f"• بررسی IDH در این جلسه"
                ),
            )

        return self._no_trigger()