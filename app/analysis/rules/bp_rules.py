"""
قوانین تحلیل فشار خون

نکات پزشکی:
- Hypertension در دیالیز شایع است (80%+ بیماران)
  علل: حجم مایعات، فعال‌سازی RAAS، دیسفانکشن اندوتلیال
- IDH (Intradialytic Hypotension) رایج‌ترین عارضه (20-30% جلسات)
  تعریف: افت سیستولیک >= 20 mmHg یا سیستولیک < 90 mmHg
  علل: UF سریع، وزن خشک نادرست، داروهای ضدفشار، نوروپاتی اتونوم
- BP بعد از دیالیز باید هدف < 140/90 باشد

منابع:
- KDIGO Blood Pressure Guidelines 2021
- KDOQI HD Adequacy (2015)
- European Renal Best Practice (ERBP)
"""

from app.analysis.rules.base import BaseRule, RuleContext, RuleResult
from app.config.thresholds import BP_THRESHOLDS
from app.shared.enums import AlertCategory, AlertSeverity
from app.shared.utils import calculate_slope


class PreDialysisHypertensionRule(BaseRule):
    """
    فشار خون بالا قبل از دیالیز

    Trigger:
    - سیستولیک >= 160: MEDIUM
    - سیستولیک >= 180: HIGH
    """
    name = "BP_PRE_HYPERTENSION"
    category = AlertCategory.BLOOD_PRESSURE

    def evaluate(self, context: RuleContext) -> RuleResult:
        session = context.current_session
        if not session:
            return self._no_trigger()

        sys_val = session.get("bp_pre_systolic")
        dia_val = session.get("bp_pre_diastolic")

        if sys_val is None:
            return self._no_trigger()

        if sys_val >= BP_THRESHOLDS.pre_systolic_high_critical:
            # Hypertensive Crisis
            return self._make_triggered(
                severity=AlertSeverity.HIGH,
                title=f"🚨 فشار بحرانی قبل دیالیز: {sys_val}/{dia_val} mmHg",
                clinician_explanation=(
                    f"فشار خون قبل از دیالیز: {sys_val}/{dia_val} mmHg — "
                    f"بالاتر از {BP_THRESHOLDS.pre_systolic_high_critical} mmHg. "
                    f"Hypertensive Crisis محتمل. "
                    f"بررسی علائم (سردرد، تاری دید، درد قفسه سینه) ضروری است. "
                    f"در صورت علائم نگران‌کننده: اقدام فوری و احتمالاً تعویق دیالیز."
                ),
                evidence={
                    "bp_pre_systolic": sys_val,
                    "bp_pre_diastolic": dia_val,
                    "session_date": session.get("date"),
                    "threshold": BP_THRESHOLDS.pre_systolic_high_critical,
                },
                education_topic="HIGH_BP",
                recommendation_draft=(
                    f"🚨 Hypertensive Crisis — {context.patient_full_name}\n\n"
                    f"مشاهدات: BP قبل = {sys_val}/{dia_val} mmHg\n"
                    f"(آستانه: >= {BP_THRESHOLDS.pre_systolic_high_critical})\n\n"
                    f"پیشنهاد اقدام:\n"
                    f"• بررسی فوری علائم end-organ damage\n"
                    f"• ارزیابی داروهای فشارخون (مصرف، دوز، زمان)\n"
                    f"• بررسی IDWG و وضعیت مایعات\n"
                    f"• تصمیم درباره ادامه یا تعویق دیالیز\n"
                    f"• بررسی نیاز به مداخله دارویی اورژانس"
                ),
                patient_message_draft=(
                    f"فشار خون شما قبل از جلسه دیالیز بسیار بالا بود. "
                    f"تیم درمان وضعیت شما را بررسی کردند. "
                    f"لطفاً داروهای فشارخون خود را طبق دستور پزشک مصرف کنید."
                ),
            )

        if sys_val >= BP_THRESHOLDS.pre_systolic_high:
            return self._make_triggered(
                severity=AlertSeverity.MEDIUM,
                title=f"فشار بالا قبل دیالیز: {sys_val}/{dia_val} mmHg",
                clinician_explanation=(
                    f"فشار خون قبل از دیالیز: {sys_val}/{dia_val} mmHg — "
                    f"بالاتر از هدف ({BP_THRESHOLDS.pre_systolic_high} mmHg). "
                    f"بررسی داروهای فشار و وضعیت مایعات توصیه می‌شود."
                ),
                evidence={
                    "bp_pre_systolic": sys_val,
                    "bp_pre_diastolic": dia_val,
                    "session_date": session.get("date"),
                },
                education_topic="HIGH_BP",
                recommendation_draft=(
                    f"📋 Hypertension قبل دیالیز — {context.patient_full_name}\n\n"
                    f"مشاهدات: BP = {sys_val}/{dia_val} mmHg\n\n"
                    f"پیشنهاد بررسی:\n"
                    f"• مرور داروهای فشارخون (مصرف منظم؟)\n"
                    f"• بررسی IDWG این جلسه\n"
                    f"• بررسی روند BP در جلسات اخیر\n"
                    f"• ارزیابی نیاز به تنظیم دارو"
                ),
                patient_message_draft=(
                    f"فشار خون شما قبل از دیالیز بالاتر از حد مطلوب بود. "
                    f"لطفاً داروهای فشارخون را منظم مصرف کنید."
                ),
            )

        return self._no_trigger()


class PreDialysisHypotensionRule(BaseRule):
    """
    فشار خون پایین قبل از دیالیز

    Trigger:
    - سیستولیک <= 100: MEDIUM
    - سیستولیک <= 90: HIGH
    """
    name = "BP_PRE_HYPOTENSION"
    category = AlertCategory.BLOOD_PRESSURE

    def evaluate(self, context: RuleContext) -> RuleResult:
        session = context.current_session
        if not session:
            return self._no_trigger()

        sys_val = session.get("bp_pre_systolic")
        dia_val = session.get("bp_pre_diastolic")

        if sys_val is None:
            return self._no_trigger()

        if sys_val <= BP_THRESHOLDS.pre_systolic_low_critical:
            return self._make_triggered(
                severity=AlertSeverity.HIGH,
                title=f"🚨 فشار بحرانی پایین قبل دیالیز: {sys_val}/{dia_val} mmHg",
                clinician_explanation=(
                    f"فشار خون قبل از دیالیز: {sys_val}/{dia_val} mmHg — "
                    f"بحرانی پایین (< {BP_THRESHOLDS.pre_systolic_low_critical} mmHg). "
                    f"ریسک: Hypotension شدید حین دیالیز، Over-UF، عوارض قلبی. "
                    f"بررسی فوری علت (داروهای فشارخون، Over-UF جلسه قبل، "
                    f"Sepsis، خونریزی) و تصمیم درباره ادامه دیالیز."
                ),
                evidence={
                    "bp_pre_systolic": sys_val,
                    "bp_pre_diastolic": dia_val,
                    "session_date": session.get("date"),
                },
                recommendation_draft=(
                    f"🚨 Hypotension بحرانی قبل دیالیز — "
                    f"{context.patient_full_name}\n\n"
                    f"مشاهدات: BP = {sys_val}/{dia_val} mmHg\n\n"
                    f"پیشنهاد اقدام:\n"
                    f"• بررسی علت: داروها، Over-UF، عفونت، خونریزی\n"
                    f"• تصمیم درباره ادامه یا تعویق دیالیز\n"
                    f"• در صورت ادامه: کاهش UF Rate، position supine\n"
                    f"• پایش دقیق‌تر BP حین جلسه"
                ),
            )

        if sys_val <= BP_THRESHOLDS.pre_systolic_low:
            return self._make_triggered(
                severity=AlertSeverity.MEDIUM,
                title=f"فشار پایین قبل دیالیز: {sys_val}/{dia_val} mmHg",
                clinician_explanation=(
                    f"فشار خون قبل از دیالیز: {sys_val}/{dia_val} mmHg — "
                    f"پایین‌تر از {BP_THRESHOLDS.pre_systolic_low} mmHg. "
                    f"بررسی داروهای فشار و احتیاط در UF Rate توصیه می‌شود."
                ),
                evidence={
                    "bp_pre_systolic": sys_val,
                    "bp_pre_diastolic": dia_val,
                    "session_date": session.get("date"),
                },
                recommendation_draft=(
                    f"📋 Hypotension قبل دیالیز — {context.patient_full_name}\n\n"
                    f"مشاهدات: BP = {sys_val}/{dia_val} mmHg\n\n"
                    f"پیشنهاد بررسی:\n"
                    f"• مرور داروهای فشارخون (دوز، زمان مصرف)\n"
                    f"• پایش دقیق BP حین جلسه\n"
                    f"• در صورت UF: احتیاط در Rate"
                ),
            )

        return self._no_trigger()


class IntradialyticHypotensionRule(BaseRule):
    """
    افت فشار حین دیالیز (IDH)

    تعریف IDH (KDIGO 2021):
    - افت سیستولیک >= 20 mmHg نسبت به قبل
    - یا سیستولیک < 90 mmHg حین دیالیز

    IDH رایج‌ترین عارضه همودیالیز است (20-30% جلسات)
    """
    name = "IDH_DETECTED"
    category = AlertCategory.BLOOD_PRESSURE

    def evaluate(self, context: RuleContext) -> RuleResult:
        session = context.current_session
        if not session:
            return self._no_trigger()

        bp_during_sys = session.get("bp_during_systolic")
        bp_pre_sys = session.get("bp_pre_systolic")
        bp_drop = session.get("bp_drop_during")

        if bp_during_sys is None:
            return self._no_trigger()

        idh_by_absolute = bp_during_sys < BP_THRESHOLDS.during_systolic_critical_low
        idh_by_drop = (
            bp_drop is not None
            and bp_drop >= BP_THRESHOLDS.during_systolic_drop_from_pre
        )

        if not (idh_by_absolute or idh_by_drop):
            return self._no_trigger()

        # تعیین severity
        if idh_by_absolute and bp_during_sys < 80:
            severity = AlertSeverity.HIGH
        else:
            severity = AlertSeverity.MEDIUM

        drop_text = (
            f"افت {bp_drop:.0f} mmHg (از {bp_pre_sys} به {bp_during_sys})"
            if bp_drop and bp_pre_sys
            else f"سیستولیک = {bp_during_sys} mmHg"
        )

        # بررسی تعداد IDH در جلسات اخیر
        recent_idh_count = sum(
            1 for s in context.recent_sessions[:5]
            if s.get("had_idh")
        )

        freq_note = ""
        if recent_idh_count >= 3:
            freq_note = (
                f" توجه: IDH در {recent_idh_count} جلسه از ۵ جلسه اخیر رخ داده — "
                f"بررسی وزن خشک و داروها ضروری است."
            )

        return self._make_triggered(
            severity=severity,
            title=f"افت فشار حین دیالیز (IDH): {drop_text}",
            clinician_explanation=(
                f"IDH تشخیص داده شد: {drop_text}. "
                f"{'IDH بحرانی (سیستولیک < 80 mmHg). ' if idh_by_absolute and bp_during_sys < 80 else ''}"
                f"علل شایع: UF Rate بالا، وزن خشک نادرست، "
                f"مصرف داروهای ضدفشار قبل از دیالیز، نوروپاتی اتونوم."
                f"{freq_note}"
            ),
            evidence={
                "bp_pre_systolic": bp_pre_sys,
                "bp_during_systolic": bp_during_sys,
                "bp_drop": bp_drop,
                "session_date": session.get("date"),
                "recent_idh_count_5sessions": recent_idh_count,
                "idh_by_absolute": idh_by_absolute,
                "idh_by_drop": idh_by_drop,
            },
            recommendation_draft=(
                f"📋 IDH — {context.patient_full_name}\n\n"
                f"مشاهدات: {drop_text}\n"
                f"IDH اخیر: {recent_idh_count}/5 جلسه\n\n"
                f"پیشنهاد بررسی:\n"
                f"• بررسی وزن خشک (احتمال پایین‌تر از واقعی)\n"
                f"• بررسی UF Rate این جلسه\n"
                f"• توقف/تعویق داروهای ضدفشار در روز دیالیز\n"
                f"• بررسی نوروپاتی اتونوم در صورت تکرار\n"
                f"• در صورت تکرار: Cool dialysate، Na profiling"
            ),
            patient_message_draft=(
                f"در طول جلسه دیالیز فشار خون شما افت کرد. "
                f"این مشکل شایع است اما قابل کنترل می‌باشد. "
                f"پزشک شما راهنمایی‌هایی برای کاهش این مشکل خواهد داشت."
            ),
        )


class PostDialysisHypotensionRule(BaseRule):
    """
    فشار خون پایین بعد از دیالیز

    Trigger: سیستولیک بعد < 90 mmHg
    """
    name = "BP_POST_HYPOTENSION"
    category = AlertCategory.BLOOD_PRESSURE

    def evaluate(self, context: RuleContext) -> RuleResult:
        session = context.current_session
        if not session:
            return self._no_trigger()

        sys_post = session.get("bp_post_systolic")
        dia_post = session.get("bp_post_diastolic")

        if sys_post is None:
            return self._no_trigger()

        if sys_post < BP_THRESHOLDS.post_systolic_critical_low:
            return self._make_triggered(
                severity=AlertSeverity.HIGH,
                title=f"🚨 فشار بسیار پایین بعد دیالیز: {sys_post}/{dia_post}",
                clinician_explanation=(
                    f"فشار خون بعد از دیالیز: {sys_post}/{dia_post} mmHg — "
                    f"بحرانی پایین. "
                    f"بیمار نباید تا تثبیت فشار ترخیص شود. "
                    f"بررسی علت (Over-UF، خونریزی، آریتمی) ضروری است."
                ),
                evidence={
                    "bp_post_systolic": sys_post,
                    "bp_post_diastolic": dia_post,
                    "session_date": session.get("date"),
                },
                recommendation_draft=(
                    f"🚨 Hypotension بحرانی پس از دیالیز — "
                    f"{context.patient_full_name}\n\n"
                    f"اقدام فوری: بیمار نباید ترخیص شود تا فشار تثبیت شود.\n"
                    f"بررسی: Over-UF، آریتمی، خونریزی\n"
                    f"اقدام: مایع‌درمانی در صورت نیاز، پایش مداوم"
                ),
            )

        return self._no_trigger()


class BPTrendRule(BaseRule):
    """
    روند صعودی یا نزولی فشار خون در جلسات اخیر

    Trigger: روند معنی‌دار در ۴ جلسه اخیر

    صعودی (فشار بالا می‌رود):
    - ممکن است نشانه Volume Overload یا نیاز به تنظیم دارو باشد
    نزولی (فشار پایین می‌آید):
    - ممکن است نشانه Over-UF یا دوز زیاد دارو باشد
    """
    name = "BP_TREND"
    category = AlertCategory.BLOOD_PRESSURE
    MIN_SESSIONS = 4

    def evaluate(self, context: RuleContext) -> RuleResult:
        pre_systolics = context.get_recent_pre_systolics(n=self.MIN_SESSIONS)

        if len(pre_systolics) < self.MIN_SESSIONS:
            return self._no_trigger()

        slope = calculate_slope(pre_systolics)

        # آستانه تغییر معنی‌دار: بیشتر از ۵ mmHg در هر جلسه
        SLOPE_THRESHOLD = 5.0

        if abs(slope) < SLOPE_THRESHOLD:
            return self._no_trigger()

        sessions_with_bp = [
            s for s in context.recent_sessions[:self.MIN_SESSIONS]
            if s.get("bp_pre_systolic")
        ]

        is_rising = slope > 0
        direction_fa = "صعودی" if is_rising else "نزولی"
        latest_bp = pre_systolics[-1] if pre_systolics else None

        severity = AlertSeverity.MEDIUM
        if is_rising and latest_bp and latest_bp >= BP_THRESHOLDS.pre_systolic_high:
            severity = AlertSeverity.HIGH

        return self._make_triggered(
            severity=severity,
            title=(
                f"روند {direction_fa} فشار خون "
                f"(شیب: {slope:+.1f} mmHg/جلسه)"
            ),
            clinician_explanation=(
                f"فشار سیستولیک قبل دیالیز در {self.MIN_SESSIONS} جلسه اخیر "
                f"روند {direction_fa} دارد (شیب: {slope:+.1f} mmHg/جلسه). "
                f"{'بررسی Volume Overload یا نیاز به تنظیم دارو.' if is_rising else 'بررسی Over-UF یا دوز زیاد داروی فشار.'}"
            ),
            evidence={
                "slope": round(slope, 2),
                "direction": "rising" if is_rising else "falling",
                "recent_values": [
                    {"date": s.get("date"), "value": s.get("bp_pre_systolic")}
                    for s in sessions_with_bp
                ],
                "n_sessions": self.MIN_SESSIONS,
            },
            education_topic="HIGH_BP",
            recommendation_draft=(
                f"📋 روند {direction_fa} BP — {context.patient_full_name}\n\n"
                f"مشاهدات: شیب {slope:+.1f} mmHg/جلسه در {self.MIN_SESSIONS} جلسه\n\n"
                f"پیشنهاد بررسی:\n"
                + (
                    f"• بررسی روند IDWG (Volume Overload؟)\n"
                    f"• بررسی مصرف منظم داروی فشار\n"
                    f"• ارزیابی نیاز به تنظیم دوز"
                    if is_rising else
                    f"• بررسی UF Rate و وزن خشک\n"
                    f"• بررسی دوز داروهای فشارخون\n"
                    f"• ارزیابی علائم Hypovolemia"
                )
            ),
        )