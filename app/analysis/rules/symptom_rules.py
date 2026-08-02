"""
قوانین تحلیل علائم و الگوهای ترکیبی

نکات پزشکی:
- علائم در دیالیز می‌توانند نشانه عوارض درمانی، بیماری‌های همراه
  یا مشکلات دسترسی عروقی باشند
- ترکیب علائم + داده‌های بالینی قدرت تشخیصی بالاتری دارد
- Fluid Overload و سوءتغذیه دو چالش اصلی قابل پیشگیری هستند

منابع:
- KDOQI Hemodialysis Adequacy Guidelines
- NKF-KDOQI Clinical Practice Guidelines
"""

from app.analysis.rules.base import BaseRule, RuleContext, RuleResult
from app.config.thresholds import (
    BP_THRESHOLDS,
    WEIGHT_THRESHOLDS,
    LAB_THRESHOLDS,
    FLUID_THRESHOLDS,
)
from app.shared.enums import (
    AlertCategory,
    AlertSeverity,
    LabTestCode,
    SymptomSeverity,
    SymptomType,
)

# ============================================================
# ثابت‌های علائم
# ============================================================
DANGER_SYMPTOMS = {
    SymptomType.CHEST_PAIN.value,
    SymptomType.SHORTNESS_OF_BREATH.value,
}

CONCERNING_SYMPTOMS = {
    SymptomType.DIZZINESS.value,
    SymptomType.SWELLING.value,
    SymptomType.ACCESS_SITE_PAIN.value,
}

SYMPTOM_NAMES_FA = {
    SymptomType.CHEST_PAIN.value: "درد قفسه سینه",
    SymptomType.SHORTNESS_OF_BREATH.value: "تنگی نفس",
    SymptomType.DIZZINESS.value: "سرگیجه",
    SymptomType.ACCESS_SITE_PAIN.value: "درد محل دسترسی عروقی",
    SymptomType.MUSCLE_CRAMP.value: "گرفتگی عضلات",
    SymptomType.NAUSEA.value: "تهوع",
    SymptomType.ITCHING.value: "خارش",
    SymptomType.HEADACHE.value: "سردرد",
    SymptomType.FATIGUE.value: "خستگی",
    SymptomType.SWELLING.value: "ورم",
}


def _get_symptom_severity(symptom: dict) -> str:
    return symptom.get("severity", "")


def _symptom_type(symptom: dict) -> str:
    return symptom.get("type", "")


# ============================================================
# قوانین علائم منفرد
# ============================================================

class DangerSymptomRule(BaseRule):
    """
    علائم خطر فوری

    هر علامت خطر → HIGH alert فوری
    این Rule با علائم در آنالیز async هم اجرا می‌شود
    (نه فقط در SymptomService)
    """
    name = "DANGER_SYMPTOM"
    category = AlertCategory.SYMPTOM

    def evaluate(self, context: RuleContext) -> RuleResult:
        if not context.recent_symptoms:
            return self._no_trigger()

        # آخرین گزارش را چک می‌کنیم
        recent_24h = [
            s for s in context.recent_symptoms
            if _symptom_type(s) in DANGER_SYMPTOMS
        ]

        if not recent_24h:
            return self._no_trigger()

        danger_names = [
            SYMPTOM_NAMES_FA.get(_symptom_type(s), _symptom_type(s))
            for s in recent_24h
        ]
        unique_names = list(dict.fromkeys(danger_names))

        # بررسی شدت
        severe_found = any(
            _get_symptom_severity(s) == SymptomSeverity.SEVERE.value
            for s in recent_24h
        )

        return self._make_triggered(
            severity=AlertSeverity.HIGH,
            title=f"⚠️ علائم خطر: {', '.join(unique_names)}",
            clinician_explanation=(
                f"بیمار {context.patient_full_name} علائم خطر گزارش داده: "
                f"{', '.join(unique_names)}. "
                f"{'شدت: شدید. ' if severe_found else ''}"
                f"بررسی فوری و ارزیابی نیاز به مداخله اورژانسی."
            ),
            evidence={
                "danger_symptoms": [
                    {
                        "type": _symptom_type(s),
                        "severity": _get_symptom_severity(s),
                        "reported_at": s.get("reported_at"),
                    }
                    for s in recent_24h
                ],
                "is_severe": severe_found,
            },
            recommendation_draft=(
                f"🚨 علائم خطر — {context.patient_full_name}\n\n"
                f"علائم: {', '.join(unique_names)}\n"
                f"شدت: {'شدید' if severe_found else 'متوسط/خفیف'}\n\n"
                f"پیشنهاد:\n"
                f"• تماس فوری با بیمار\n"
                f"• ارزیابی نیاز به مراجعه اورژانسی\n"
                f"• در صورت درد سینه: ECG فوری\n"
                f"• در صورت تنگی نفس: بررسی Fluid Overload"
            ),
            patient_message_draft=(
                f"⚠️ تیم پزشکی از علائم شما مطلع شدند. "
                f"اگر وضعیت بدتر شد یا علائم جدی دارید (درد سینه، "
                f"تنگی نفس شدید)، فوراً با اورژانس تماس بگیرید."
            ),
        )


class RecurrentSymptomsRule(BaseRule):
    """
    علائم تکرارشونده

    یک علامت که در ۵ روز اخیر ۳+ بار گزارش شده
    → احتمال مشکل سیستماتیک که نیاز به بررسی دارد
    """
    name = "RECURRING_SYMPTOMS"
    category = AlertCategory.SYMPTOM
    DAYS = 7
    MIN_COUNT = 3

    def evaluate(self, context: RuleContext) -> RuleResult:
        if not context.recent_symptoms:
            return self._no_trigger()

        # شمارش هر نوع علامت
        symptom_counter: dict[str, int] = {}
        for s in context.recent_symptoms:
            stype = _symptom_type(s)
            if stype:
                symptom_counter[stype] = symptom_counter.get(stype, 0) + 1

        # پیدا کردن علائم تکرارشونده
        recurrent = {
            stype: count
            for stype, count in symptom_counter.items()
            if count >= self.MIN_COUNT
        }

        if not recurrent:
            return self._no_trigger()

        most_frequent_type = max(recurrent, key=recurrent.get)
        most_frequent_count = recurrent[most_frequent_type]
        name_fa = SYMPTOM_NAMES_FA.get(most_frequent_type, most_frequent_type)

        all_recurrent_fa = [
            f"{SYMPTOM_NAMES_FA.get(t, t)} ({c} بار)"
            for t, c in recurrent.items()
        ]

        return self._make_triggered(
            severity=AlertSeverity.MEDIUM,
            title=(
                f"علامت تکرارشونده: {name_fa} "
                f"({most_frequent_count}× در {self.DAYS} روز)"
            ),
            clinician_explanation=(
                f"علائم تکرارشونده در {self.DAYS} روز اخیر: "
                f"{', '.join(all_recurrent_fa)}. "
                f"تکرار علامت ممکن است نشانه مشکل سیستماتیک باشد. "
                f"بررسی علت زمینه‌ای توصیه می‌شود."
            ),
            evidence={
                "recurrent_symptoms": recurrent,
                "period_days": self.DAYS,
                "most_frequent": most_frequent_type,
                "most_frequent_count": most_frequent_count,
            },
            recommendation_draft=(
                f"📋 علائم تکرارشونده — {context.patient_full_name}\n\n"
                f"علائم در {self.DAYS} روز: {', '.join(all_recurrent_fa)}\n\n"
                f"پیشنهاد بررسی:\n"
                + _get_recurrent_symptom_recommendations(most_frequent_type)
            ),
        )


def _get_recurrent_symptom_recommendations(symptom_type: str) -> str:
    """پیشنهادهای خاص برای هر نوع علامت تکرارشونده"""
    recs = {
        SymptomType.MUSCLE_CRAMP.value: (
            "• بررسی Over-UF و وزن خشک\n"
            "• بررسی الکترولیت‌ها (K، Ca، Mg)\n"
            "• بررسی سرعت UF Rate"
        ),
        SymptomType.NAUSEA.value: (
            "• بررسی آزمایش‌های اورمی (BUN، Creatinine)\n"
            "• بررسی کفایت دیالیز (Kt/V)\n"
            "• بررسی داروها (زمان مصرف)"
        ),
        SymptomType.HEADACHE.value: (
            "• بررسی BP قبل و بعد دیالیز\n"
            "• بررسی سرعت UF\n"
            "• بررسی Dialysis Disequilibrium"
        ),
        SymptomType.ITCHING.value: (
            "• بررسی P و PTH (Uremic Pruritus)\n"
            "• بررسی Ca×P Product\n"
            "• ارزیابی درمان ضد خارش"
        ),
        SymptomType.FATIGUE.value: (
            "• بررسی Hb (کم‌خونی)\n"
            "• بررسی کفایت دیالیز\n"
            "• بررسی افسردگی و وضعیت روانی"
        ),
        SymptomType.DIZZINESS.value: (
            "• بررسی IDH (فشار حین دیالیز)\n"
            "• بررسی Over-UF\n"
            "• بررسی Hb"
        ),
    }
    return recs.get(
        symptom_type,
        "• بررسی علت زمینه‌ای با ارزیابی بالینی"
    )


class AccessSitePainRule(BaseRule):
    """
    درد محل دسترسی عروقی

    فیستول/گرافت/کاتتر دیالیز حیاتی‌ترین دسترسی بیمار است.
    درد می‌تواند نشانه:
    - عفونت (Bacteremia)
    - ترومبوز
    - Steal Syndrome
    - آنوریسم
    """
    name = "ACCESS_SITE_CONCERN"
    category = AlertCategory.SYMPTOM

    def evaluate(self, context: RuleContext) -> RuleResult:
        access_pain = [
            s for s in context.recent_symptoms
            if _symptom_type(s) == SymptomType.ACCESS_SITE_PAIN.value
        ]

        if not access_pain:
            return self._no_trigger()

        # بررسی شدت
        severe = any(
            _get_symptom_severity(s) == SymptomSeverity.SEVERE.value
            for s in access_pain
        )
        count = len(access_pain)

        severity = AlertSeverity.HIGH if severe else AlertSeverity.MEDIUM

        return self._make_triggered(
            severity=severity,
            title=(
                f"{'شدید: ' if severe else ''}درد محل دسترسی عروقی "
                f"({count}× گزارش)"
            ),
            clinician_explanation=(
                f"درد محل دسترسی عروقی {count} بار در دوره اخیر گزارش شده. "
                f"{'شدت: شدید. ' if severe else ''}"
                f"علل مهم: عفونت (Bacteremia/Abscess)، ترومبوز، Steal Syndrome. "
                f"بررسی فیزیکی دسترسی عروقی ضروری است."
            ),
            evidence={
                "reports": [
                    {
                        "severity": _get_symptom_severity(s),
                        "reported_at": s.get("reported_at"),
                    }
                    for s in access_pain
                ],
                "count": count,
                "has_severe": severe,
            },
            recommendation_draft=(
                f"📋 درد دسترسی عروقی — {context.patient_full_name}\n\n"
                f"گزارش‌ها: {count} بار، شدت: "
                f"{'شدید' if severe else 'متوسط/خفیف'}\n\n"
                f"پیشنهاد بررسی:\n"
                f"• معاینه فیزیکی دسترسی (قرمزی، گرما، ترشح، لرزش/صدا)\n"
                f"• کشت خون در صورت تب\n"
                f"• Color Doppler Ultrasound در صورت مشکوک بودن\n"
                f"• بررسی Steal Syndrome در صورت درد + ضعف دست"
            ),
            patient_message_draft=(
                f"درد در محل دسترسی دیالیز شما گزارش شده است. "
                f"لطفاً محل فیستول/کاتتر را بررسی کنید:\n"
                f"اگر قرمزی، گرما، تورم یا ترشح وجود دارد یا درد شدید است، "
                f"فوراً با تیم پزشکی تماس بگیرید."
            ),
        )


# ============================================================
# قوانین ترکیبی (Cross-domain)
# ============================================================

class FluidOverloadPatternRule(BaseRule):
    """
    الگوی احتباس مایعات (Fluid Overload)

    Cross-domain: IDWG بالا + تنگی نفس/ورم + مصرف مایعات زیاد
    این ترکیب ریسک بسیار بالایی برای عوارض حاد دارد.

    Fluid Overload در دیالیز = یکی از اصلی‌ترین علل بستری و مرگ
    """
    name = "FLUID_OVERLOAD_PATTERN"
    category = AlertCategory.SYMPTOM

    def evaluate(self, context: RuleContext) -> RuleResult:
        # ============================================================
        # بررسی IDWG
        # ============================================================
        high_idwg = False
        idwg_value = None

        if context.recent_sessions:
            latest_session = context.recent_sessions[0]
            idwg_pct = latest_session.get("weight_gain_percent")
            if idwg_pct and idwg_pct >= WEIGHT_THRESHOLDS.idwg_percent_warning:
                high_idwg = True
                idwg_value = idwg_pct

        # ============================================================
        # بررسی علائم Fluid Overload
        # ============================================================
        fluid_symptoms = [
            s for s in context.recent_symptoms
            if _symptom_type(s) in {
                SymptomType.SHORTNESS_OF_BREATH.value,
                SymptomType.SWELLING.value,
            }
        ]
        has_fluid_symptoms = len(fluid_symptoms) > 0

        # ============================================================
        # بررسی مصرف مایعات
        # ============================================================
        high_fluid_intake = False
        avg_fluid = None
        if context.fluid_summary:
            avg_fluid = context.fluid_summary.get("avg_7d_ml")
            if avg_fluid and avg_fluid >= FLUID_THRESHOLDS.daily_warning_ml:
                high_fluid_intake = True

        # حداقل دو تا از سه عامل باید وجود داشته باشند
        factors_present = sum([high_idwg, has_fluid_symptoms, high_fluid_intake])

        if factors_present < 2:
            return self._no_trigger()

        symptom_names = [
            SYMPTOM_NAMES_FA.get(_symptom_type(s), _symptom_type(s))
            for s in fluid_symptoms
        ]

        evidence = {
            "high_idwg": high_idwg,
            "idwg_percent": idwg_value,
            "fluid_symptoms": [_symptom_type(s) for s in fluid_symptoms],
            "high_fluid_intake": high_fluid_intake,
            "avg_fluid_ml": avg_fluid,
            "factors_present": factors_present,
        }

        explanation_parts = []
        if high_idwg:
            explanation_parts.append(f"IDWG = {idwg_value:.1f}%")
        if has_fluid_symptoms:
            explanation_parts.append(f"علائم: {', '.join(symptom_names)}")
        if high_fluid_intake:
            explanation_parts.append(
                f"میانگین مایعات ۷ روز: {avg_fluid:.0f} ml"
            )

        return self._make_triggered(
            severity=AlertSeverity.HIGH,
            title=(
                f"الگوی Fluid Overload "
                f"({factors_present}/3 عامل)"
            ),
            clinician_explanation=(
                f"الگوی احتباس مایعات شناسایی شد — "
                f"{context.patient_full_name}: "
                f"{' + '.join(explanation_parts)}. "
                f"ریسک ادم ریوی و Cardiac Failure. "
                f"بررسی فوری و تنظیم برنامه مدیریت مایعات."
            ),
            evidence=evidence,
            education_topic="HIGH_IDWG",
            recommendation_draft=(
                f"📋 Fluid Overload Pattern — {context.patient_full_name}\n\n"
                f"عوامل موجود ({factors_present}/3):\n"
                + ("\n".join(f"✓ {p}" for p in explanation_parts))
                + "\n\n"
                f"پیشنهاد بررسی:\n"
                f"• بررسی فیزیکی: ادم، صدای تنفس، JVP\n"
                f"• بررسی و احتمالاً تنظیم وزن خشک\n"
                f"• مرور مصرف مایعات و آموزش مجدد\n"
                f"• بررسی رعایت رژیم سدیم\n"
                f"• در صورت علائم حاد: بررسی نیاز به دیالیز اورژانسی"
            ),
            patient_message_draft=(
                f"⚠️ وضعیت مایعات بدن شما نگران‌کننده است. "
                f"ترکیب افزایش وزن، مصرف زیاد مایعات "
                f"{'و ' + '/'.join(symptom_names) if symptom_names else ''} "
                f"می‌تواند خطرناک باشد. "
                f"لطفاً مصرف مایعات را به حداقل برسانید و "
                f"اگر تنگی نفس دارید، فوراً اطلاع دهید."
            ),
        )


class MalnutritionRiskRule(BaseRule):
    """
    ریسک سوءتغذیه

    Cross-domain: Alb پایین + بی‌اشتهایی + رعایت ضعیف پروتئین
    سوءتغذیه در دیالیز → مرگ‌ومیر بالاتر، بستری بیشتر

    PEW (Protein-Energy Wasting) در 18-75% بیماران دیالیزی
    """
    name = "MALNUTRITION_RISK"
    category = AlertCategory.SYMPTOM

    def evaluate(self, context: RuleContext) -> RuleResult:
        # ============================================================
        # بررسی آلبومین
        # ============================================================
        alb_val = context.get_lab_value(LabTestCode.ALBUMIN.value)
        low_albumin = (
            alb_val is not None
            and alb_val < LAB_THRESHOLDS.alb_normal_low
        )

        # ============================================================
        # بررسی بی‌اشتهایی در علائم
        # ============================================================
        appetite_loss = any(
            _symptom_type(s) == SymptomType.FATIGUE.value
            for s in context.recent_symptoms
        )
        nausea_reported = any(
            _symptom_type(s) == SymptomType.NAUSEA.value
            for s in context.recent_symptoms
        )

        # ============================================================
        # بررسی رعایت رژیم پروتئین
        # ============================================================
        poor_protein = False
        protein_poor_rate = 0.0
        if context.diet_summary:
            protein_poor_rate = context.diet_summary.get(
                "protein_poor_rate", 0
            )
            poor_protein = protein_poor_rate >= 50

        # ============================================================
        # حداقل دو عامل
        # ============================================================
        factors = {
            "low_albumin": low_albumin,
            "appetite_or_nausea": appetite_loss or nausea_reported,
            "poor_protein_diet": poor_protein,
        }
        active_factors = [k for k, v in factors.items() if v]

        if len(active_factors) < 2:
            return self._no_trigger()

        # بررسی CRP برای تفکیک
        crp = context.get_lab_value(LabTestCode.CRP.value)
        inflammation_note = (
            f" (توجه: CRP = {crp} — التهاب همزمان)"
            if crp and crp > 10 else ""
        )

        factor_descriptions = []
        if low_albumin:
            factor_descriptions.append(f"Alb = {alb_val} g/dL")
        if appetite_loss or nausea_reported:
            symptoms = []
            if appetite_loss:
                symptoms.append("خستگی/بی‌اشتهایی")
            if nausea_reported:
                symptoms.append("تهوع")
            factor_descriptions.append(f"علائم: {', '.join(symptoms)}")
        if poor_protein:
            factor_descriptions.append(
                f"رعایت ضعیف پروتئین: {protein_poor_rate:.0f}% روزها"
            )

        return self._make_triggered(
            severity=AlertSeverity.MEDIUM,
            title=f"ریسک سوءتغذیه ({len(active_factors)}/3 عامل)",
            clinician_explanation=(
                f"ریسک PEW (Protein-Energy Wasting) در "
                f"{context.patient_full_name}: "
                f"{' + '.join(factor_descriptions)}.{inflammation_note} "
                f"ارزیابی تغذیه‌ای و مداخله زودهنگام توصیه می‌شود."
            ),
            evidence={
                "factors": factors,
                "albumin": alb_val,
                "protein_poor_rate": protein_poor_rate,
                "crp": crp,
                "factor_descriptions": factor_descriptions,
            },
            education_topic="LOW_ALB",
            recommendation_draft=(
                f"📋 ریسک سوءتغذیه — {context.patient_full_name}\n\n"
                f"عوامل ({len(active_factors)}/3):\n"
                + "\n".join(f"✓ {d}" for d in factor_descriptions)
                + f"{inflammation_note}\n\n"
                f"پیشنهاد بررسی:\n"
                f"• ارزیابی تغذیه‌ای توسط متخصص تغذیه\n"
                f"• بررسی مصرف پروتئین روزانه (هدف: 1.2 g/kg/day)\n"
                f"• بررسی علل بی‌اشتهایی (دارویی، روانی، اورمی)\n"
                f"• بررسی کفایت دیالیز (Kt/V)\n"
                f"• در صورت نیاز: ONS (مکمل تغذیه خوراکی)\n"
                f"• رد کمبود B12، Folate، Zinc"
            ),
            patient_message_draft=(
                f"بررسی‌های اخیر نشان می‌دهد که احتمالاً دریافت پروتئین و "
                f"انرژی کافی ندارید. "
                f"پروتئین برای عضلات و سیستم ایمنی شما ضروری است. "
                f"پزشک یا متخصص تغذیه راهنمایی‌های بیشتری خواهند داشت."
            ),
        )