"""
قوانین تحلیل آزمایشگاهی بیماران همودیالیز

نکات پزشکی کلیدی:
- مقادیر مرجع در دیالیز با جمعیت عمومی تفاوت دارد
- K بالا = اورژانس قلبی (ریسک آریتمی و ایست قلبی)
- P بالا مزمن = Vascular Calcification و مرگ‌ومیر بالاتر
- Hb پایین = کیفیت زندگی پایین‌تر و بار قلبی بیشتر
- Alb پایین = قوی‌ترین پیش‌بینی‌کننده مرگ‌ومیر در دیالیز
- ترکیب چند تست از یک تست منفرد مهم‌تر است

منابع:
- KDIGO CKD-MBD Guidelines 2017
- KDOQI Anemia Guidelines 2012
- KDIGO Potassium Guidelines 2020
- NKF-KDOQI Nutrition Guidelines
- ERA-EDTA Guidelines
"""

from app.analysis.rules.base import BaseRule, RuleContext, RuleResult
from app.config.thresholds import LAB_THRESHOLDS
from app.shared.enums import AlertCategory, AlertSeverity, LabTestCode
from app.shared.utils import calculate_slope


# ============================================================
# پتاسیم (Potassium)
# ============================================================

class HyperkalemiaRule(BaseRule):
    """
    پتاسیم بالا (Hyperkalemia)

    پتاسیم مهم‌ترین الکترولیت از نظر ریسک فوری است.
    هایپرکالمی در دیالیز رایج است زیرا کلیه نمی‌تواند K دفع کند.

    آستانه‌ها (بر اساس KDIGO 2020):
    - K > 5.0: خفیف — آموزش رژیم
    - K > 5.5: متوسط — مداخله لازم
    - K > 6.0: بحرانی — ریسک آریتمی مرگبار
    - K > 7.0: اورژانس قلبی فوری
    """
    name = "HIGH_K"
    category = AlertCategory.LAB

    def evaluate(self, context: RuleContext) -> RuleResult:
        k_val = context.get_lab_value(LabTestCode.POTASSIUM.value)
        if k_val is None:
            return self._no_trigger()

        lab_info = context.latest_labs.get(LabTestCode.POTASSIUM.value, {})
        lab_date = lab_info.get("date", "نامشخص")

        # K > 7.0: اورژانس مطلق
        if k_val >= LAB_THRESHOLDS.k_emergency:
            return self._make_triggered(
                severity=AlertSeverity.HIGH,
                title=f"🚨 پتاسیم اورژانسی: {k_val} mEq/L",
                clinician_explanation=(
                    f"پتاسیم = {k_val} mEq/L (تاریخ: {lab_date}) — "
                    f"بالاتر از سطح اورژانسی ({LAB_THRESHOLDS.k_emergency} mEq/L). "
                    f"ریسک بسیار بالای آریتمی کشنده (VF/VT/Asystole). "
                    f"اقدام فوری: ECG، کاهش K با دیالیز یا درمان دارویی اورژانس "
                    f"(Calcium gluconate، Insulin+Glucose، Kayexalate)."
                ),
                evidence={
                    "k_value": k_val,
                    "lab_date": lab_date,
                    "threshold_emergency": LAB_THRESHOLDS.k_emergency,
                    "unit": "mEq/L",
                },
                education_topic="HIGH_K",
                recommendation_draft=(
                    f"🚨 Hyperkalemia اورژانسی — {context.patient_full_name}\n\n"
                    f"مشاهدات: K = {k_val} mEq/L (تاریخ: {lab_date})\n"
                    f"وضعیت: اورژانسی (>= {LAB_THRESHOLDS.k_emergency} mEq/L)\n\n"
                    f"اقدامات پیشنهادی (با نظر پزشک):\n"
                    f"• ECG فوری برای بررسی تغییرات قلبی\n"
                    f"• Calcium gluconate IV (محافظت قلبی)\n"
                    f"• Insulin + Dextrose (shift K به داخل سلول)\n"
                    f"• بررسی زمان دیالیز بعدی — آیا باید تسریع شود؟\n"
                    f"• Kayexalate یا Patiromer در صورت تأخیر دیالیز\n"
                    f"• آموزش فوری پرهیز از غذاهای پرپتاسیم"
                ),
                patient_message_draft=(
                    f"⚠️ مهم: آزمایش اخیر نشان داد پتاسیم خون شما "
                    f"بسیار بالا است ({k_val} mEq/L). "
                    f"این وضعیت می‌تواند برای قلب خطرناک باشد. "
                    f"تیم پزشکی بلافاصله با شما در ارتباط خواهند بود. "
                    f"از خوردن موز، خرما، سیب‌زمینی، آجیل و لبنیات خودداری کنید."
                ),
            )

        # K > 6.0: بحرانی
        if k_val >= LAB_THRESHOLDS.k_critical_high:
            return self._make_triggered(
                severity=AlertSeverity.HIGH,
                title=f"پتاسیم بحرانی: {k_val} mEq/L",
                clinician_explanation=(
                    f"پتاسیم = {k_val} mEq/L — "
                    f"بالاتر از {LAB_THRESHOLDS.k_critical_high} mEq/L. "
                    f"ریسک آریتمی قلبی (Peaked T-wave، Prolonged PR، Wide QRS). "
                    f"بررسی ECG، مرور رژیم غذایی و برنامه دیالیز توصیه می‌شود."
                ),
                evidence={
                    "k_value": k_val,
                    "lab_date": lab_date,
                    "threshold_critical": LAB_THRESHOLDS.k_critical_high,
                },
                education_topic="HIGH_K",
                recommendation_draft=(
                    f"📋 Hyperkalemia بحرانی — {context.patient_full_name}\n\n"
                    f"مشاهدات: K = {k_val} mEq/L (تاریخ: {lab_date})\n\n"
                    f"پیشنهاد بررسی:\n"
                    f"• ECG برای بررسی تغییرات قلبی ناشی از هایپرکالمی\n"
                    f"• مرور گزارش رژیم غذایی بیمار (پتاسیم)\n"
                    f"• بررسی داروهای بالابرنده K (ACEi, ARB, Spironolactone)\n"
                    f"• بررسی احتمال همولیز نمونه (مقدار خیلی بالا؟)\n"
                    f"• آموزش محدودیت غذایی پتاسیم"
                ),
                patient_message_draft=(
                    f"آزمایش اخیر نشان داد پتاسیم خون شما بالاتر از حد ایمن است "
                    f"({k_val} mEq/L). "
                    f"لطفاً مصرف غذاهای پرپتاسیم را کاهش دهید: "
                    f"موز، خرما، آجیل، سیب‌زمینی، گوجه‌فرنگی، حبوبات."
                ),
            )

        # K > 5.5: هشدار
        if k_val >= LAB_THRESHOLDS.k_warning_high:
            return self._make_triggered(
                severity=AlertSeverity.MEDIUM,
                title=f"پتاسیم بالا: {k_val} mEq/L",
                clinician_explanation=(
                    f"پتاسیم = {k_val} mEq/L — "
                    f"بالاتر از {LAB_THRESHOLDS.k_warning_high} mEq/L. "
                    f"بررسی رژیم غذایی و آموزش محدودیت پتاسیم توصیه می‌شود."
                ),
                evidence={"k_value": k_val, "lab_date": lab_date},
                education_topic="HIGH_K",
                recommendation_draft=(
                    f"📋 Hyperkalemia — {context.patient_full_name}\n\n"
                    f"K = {k_val} mEq/L\n\n"
                    f"پیشنهاد: مرور رژیم غذایی + آموزش محدودیت پتاسیم"
                ),
                patient_message_draft=(
                    f"پتاسیم خون شما کمی بالاتر از حد مطلوب است ({k_val} mEq/L). "
                    f"لطفاً مصرف غذاهای پرپتاسیم را محدود کنید."
                ),
            )

        # K > 5.0: خفیف
        if k_val > LAB_THRESHOLDS.k_normal_high:
            return self._make_triggered(
                severity=AlertSeverity.LOW,
                title=f"پتاسیم خفیف بالا: {k_val} mEq/L",
                clinician_explanation=(
                    f"پتاسیم = {k_val} mEq/L — کمی بالاتر از مرجع. "
                    f"پایش و آموزش رژیم توصیه می‌شود."
                ),
                evidence={"k_value": k_val, "lab_date": lab_date},
                education_topic="HIGH_K",
                patient_message_draft=(
                    f"پتاسیم خون شما ({k_val} mEq/L) کمی بالاتر از حد طبیعی است. "
                    f"دقت در مصرف غذاهای پرپتاسیم را افزایش دهید."
                ),
            )

        return self._no_trigger()


class HypokalemiaRule(BaseRule):
    """
    پتاسیم پایین (Hypokalemia)

    هایپوکالمی در دیالیز کمتر شایع است اما خطرناک است.
    علل: سوءتغذیه، اسهال، دیالیز بیش از حد.
    ریسک: آریتمی (U-wave، VT)، ضعف عضلانی، فلج تنفسی.

    آستانه‌ها:
    - K < 3.5: هشدار
    - K < 3.0: بحرانی
    """
    name = "LOW_K"
    category = AlertCategory.LAB

    def evaluate(self, context: RuleContext) -> RuleResult:
        k_val = context.get_lab_value(LabTestCode.POTASSIUM.value)
        if k_val is None:
            return self._no_trigger()

        lab_info = context.latest_labs.get(LabTestCode.POTASSIUM.value, {})
        lab_date = lab_info.get("date", "نامشخص")

        if k_val <= LAB_THRESHOLDS.k_critical_low:
            return self._make_triggered(
                severity=AlertSeverity.HIGH,
                title=f"🚨 پتاسیم بحرانی پایین: {k_val} mEq/L",
                clinician_explanation=(
                    f"پتاسیم = {k_val} mEq/L — "
                    f"زیر {LAB_THRESHOLDS.k_critical_low} mEq/L. "
                    f"ریسک آریتمی (U-wave، VT)، ضعف عضلانی، Ileus. "
                    f"بررسی علت (سوءتغذیه، اسهال، استفاده بیش از حد از K-binding resin) "
                    f"و جایگزینی K با احتیاط در بیماران کلیوی."
                ),
                evidence={
                    "k_value": k_val,
                    "lab_date": lab_date,
                    "threshold_critical": LAB_THRESHOLDS.k_critical_low,
                },
                recommendation_draft=(
                    f"🚨 Hypokalemia بحرانی — {context.patient_full_name}\n\n"
                    f"K = {k_val} mEq/L (تاریخ: {lab_date})\n\n"
                    f"پیشنهاد بررسی:\n"
                    f"• ECG برای U-wave و تغییرات قلبی\n"
                    f"• بررسی علت: اسهال، استفراغ، Kayexalate بیش از حد\n"
                    f"• بررسی وضعیت تغذیه‌ای\n"
                    f"• جایگزینی K با احتیاط (خطر Rebound Hyperkalemia)\n"
                    f"• تنظیم دیالیزور و غلظت K در دیالیزات"
                ),
            )

        if k_val < LAB_THRESHOLDS.k_normal_low:
            return self._make_triggered(
                severity=AlertSeverity.MEDIUM,
                title=f"پتاسیم پایین: {k_val} mEq/L",
                clinician_explanation=(
                    f"پتاسیم = {k_val} mEq/L — "
                    f"زیر {LAB_THRESHOLDS.k_normal_low} mEq/L. "
                    f"بررسی علت و وضعیت تغذیه‌ای توصیه می‌شود."
                ),
                evidence={"k_value": k_val, "lab_date": lab_date},
                recommendation_draft=(
                    f"📋 Hypokalemia — {context.patient_full_name}\n\n"
                    f"K = {k_val} mEq/L\n\n"
                    f"پیشنهاد: بررسی علت + وضعیت تغذیه"
                ),
            )

        return self._no_trigger()


# ============================================================
# فسفر (Phosphorus)
# ============================================================

class HyperphosphatemiaRule(BaseRule):
    """
    فسفر بالا (Hyperphosphatemia)

    رایج‌ترین اختلال معدنی در دیالیز (70%+ بیماران).
    مزمن بودن P بالا → Vascular Calcification → مرگ‌ومیر.

    هدف KDIGO 2017: نزدیک به نرمال (تا 5.5 mg/dL)
    عملاً < 5.5 هدف رایج برای بیماران دیالیزی

    آستانه‌ها:
    - P > 4.5: خفیف — آموزش فوری
    - P > 5.5: متوسط
    - P > 7.0: بحرانی — ریسک Calcification شدید
    """
    name = "HIGH_P"
    category = AlertCategory.LAB

    def evaluate(self, context: RuleContext) -> RuleResult:
        p_val = context.get_lab_value(LabTestCode.PHOSPHORUS.value)
        if p_val is None:
            return self._no_trigger()

        lab_info = context.latest_labs.get(LabTestCode.PHOSPHORUS.value, {})
        lab_date = lab_info.get("date", "نامشخص")

        # Ca × P Product
        ca_val = context.get_lab_value(LabTestCode.CALCIUM.value)
        ca_p_product = round(ca_val * p_val, 1) if ca_val else None
        ca_p_note = (
            f" Ca×P = {ca_p_product} (هدف < 55)."
            if ca_p_product else ""
        )

        if p_val >= LAB_THRESHOLDS.p_critical_high:
            return self._make_triggered(
                severity=AlertSeverity.HIGH,
                title=f"فسفر بحرانی: {p_val} mg/dL",
                clinician_explanation=(
                    f"فسفر = {p_val} mg/dL (تاریخ: {lab_date}) — "
                    f"بالاتر از {LAB_THRESHOLDS.p_critical_high} mg/dL.{ca_p_note} "
                    f"ریسک بالای Vascular Calcification، CKD-MBD، و مرگ‌ومیر قلبی. "
                    f"بررسی رعایت فسفات‌بایندر و رژیم غذایی."
                ),
                evidence={
                    "p_value": p_val,
                    "lab_date": lab_date,
                    "ca_p_product": ca_p_product,
                    "threshold_critical": LAB_THRESHOLDS.p_critical_high,
                },
                education_topic="HIGH_P",
                recommendation_draft=(
                    f"📋 Hyperphosphatemia بحرانی — {context.patient_full_name}\n\n"
                    f"P = {p_val} mg/dL{f', Ca×P = {ca_p_product}' if ca_p_product else ''}\n\n"
                    f"پیشنهاد بررسی:\n"
                    f"• بررسی مصرف منظم فسفات‌بایندر (همراه وعده غذایی)\n"
                    f"• مرور رژیم غذایی (لبنیات، فست‌فود، نوشابه)\n"
                    f"• بررسی نوع و دوز بایندر (تنظیم در صورت نیاز)\n"
                    f"• بررسی PTH و Ca برای ارزیابی CKD-MBD\n"
                    f"• آموزش مجدد و تأکید بر اهمیت بایندر"
                ),
                patient_message_draft=(
                    f"آزمایش نشان داد فسفر خون شما ({p_val} mg/dL) بسیار بالاست. "
                    f"فسفر بالا به رگ‌های خونی و قلب آسیب می‌زند. "
                    f"مهم‌ترین اقدام: قرص‌های فسفات‌بایندر را سر هر وعده غذایی مصرف کنید "
                    f"و از لبنیات، نوشابه و فست‌فود پرهیز کنید."
                ),
            )

        if p_val >= LAB_THRESHOLDS.p_warning_high:
            return self._make_triggered(
                severity=AlertSeverity.MEDIUM,
                title=f"فسفر بالا: {p_val} mg/dL",
                clinician_explanation=(
                    f"فسفر = {p_val} mg/dL.{ca_p_note} "
                    f"بررسی رژیم و مصرف بایندر توصیه می‌شود."
                ),
                evidence={
                    "p_value": p_val,
                    "lab_date": lab_date,
                    "ca_p_product": ca_p_product,
                },
                education_topic="HIGH_P",
                recommendation_draft=(
                    f"📋 Hyperphosphatemia — {context.patient_full_name}\n\n"
                    f"P = {p_val} mg/dL\n\n"
                    f"پیشنهاد: بررسی بایندر + آموزش رژیم فسفر"
                ),
                patient_message_draft=(
                    f"فسفر خون شما ({p_val} mg/dL) بالاتر از حد مطلوب است. "
                    f"قرص‌های فسفات‌بایندر را همراه وعده غذایی مصرف کنید."
                ),
            )

        if p_val > LAB_THRESHOLDS.p_normal_high:
            return self._make_triggered(
                severity=AlertSeverity.LOW,
                title=f"فسفر خفیف بالا: {p_val} mg/dL",
                clinician_explanation=(
                    f"فسفر = {p_val} mg/dL — کمی بالاتر از هدف. "
                    f"آموزش رژیم توصیه می‌شود."
                ),
                evidence={"p_value": p_val, "lab_date": lab_date},
                education_topic="HIGH_P",
                patient_message_draft=(
                    f"فسفر خون شما ({p_val} mg/dL) کمی بالاتر از حد مطلوب است. "
                    f"در مصرف غذاهای پرفسفر دقت کنید."
                ),
            )

        return self._no_trigger()


class HyperphosphatemiaWithPoorDietRule(BaseRule):
    """
    فسفر بالا + رعایت ضعیف رژیم

    Cross-domain Rule:
    ترکیب P بالا با گزارش عدم رعایت رژیم فسفر
    → آموزش هدفمند + یادآوری بایندر
    """
    name = "HIGH_P_POOR_DIET"
    category = AlertCategory.LAB

    def evaluate(self, context: RuleContext) -> RuleResult:
        p_val = context.get_lab_value(LabTestCode.PHOSPHORUS.value)
        if p_val is None or p_val <= LAB_THRESHOLDS.p_normal_high:
            return self._no_trigger()

        diet = context.diet_summary
        if not diet:
            return self._no_trigger()

        p_poor_rate = diet.get("phosphorus_poor_rate", 0)
        binder_missed = diet.get("binder_missed_rate", 0)

        # P بالا + رعایت ضعیف ≥ 40% یا مصرف نکردن بایندر ≥ 30%
        poor_diet_concern = p_poor_rate >= 40 or binder_missed >= 30
        if not poor_diet_concern:
            return self._no_trigger()

        lab_date = context.latest_labs.get(
            LabTestCode.PHOSPHORUS.value, {}
        ).get("date", "نامشخص")

        return self._make_triggered(
            severity=AlertSeverity.MEDIUM,
            title=f"فسفر بالا + رژیم ضعیف: P={p_val} mg/dL",
            clinician_explanation=(
                f"فسفر = {p_val} mg/dL + رعایت ضعیف رژیم فسفر "
                f"({p_poor_rate:.0f}% روزها). "
                f"{'بایندر در ' + str(binder_missed) + '% روزها مصرف نشده. ' if binder_missed >= 30 else ''}"
                f"جلسه آموزشی هدفمند درباره رژیم فسفر و اهمیت بایندر "
                f"با تأیید پزشک پیشنهاد می‌شود."
            ),
            evidence={
                "p_value": p_val,
                "lab_date": lab_date,
                "phosphorus_poor_rate": p_poor_rate,
                "binder_missed_rate": binder_missed,
            },
            education_topic="HIGH_P_BINDER",
            recommendation_draft=(
                f"📋 P بالا + رعایت ضعیف رژیم — {context.patient_full_name}\n\n"
                f"P = {p_val} mg/dL، رعایت ضعیف: {p_poor_rate:.0f}% روزها\n"
                f"{'بایندر فراموش‌شده: ' + str(binder_missed) + '% روزها' if binder_missed else ''}\n\n"
                f"پیشنهاد مداخله:\n"
                f"• جلسه آموزشی تخصصی درباره فسفر و بایندر\n"
                f"• بررسی نوع و زمان مصرف بایندر\n"
                f"• توضیح پیامدهای بلندمدت P بالا (به زبان ساده)\n"
                f"• یادآوری از طریق اپ برای مصرف بایندر"
            ),
            patient_message_draft=(
                f"آزمایش نشان داد فسفر خون شما ({p_val} mg/dL) بالاست "
                f"و گزارش رژیم شما نشان می‌دهد رعایت محدودیت فسفر مشکل داشته. "
                f"یادآوری مهم:\n"
                f"✅ قرص فسفات‌بایندر را سر هر وعده غذایی (نه بعد از آن) بخورید\n"
                f"❌ از لبنیات زیاد، نوشابه، فست‌فود و غذاهای فرآوری‌شده پرهیز کنید\n"
                f"پزشک شما توضیحات بیشتری خواهد داد."
            ),
        )


# ============================================================
# کم‌خونی (Anemia)
# ============================================================

class AnemiaRule(BaseRule):
    """
    کم‌خونی (Anemia of CKD)

    تقریباً همه بیماران دیالیزی کم‌خونی دارند.
    علت اصلی: کمبود EPO (Erythropoietin) از کلیه + کمبود آهن.
    هدف KDIGO: Hb 10-12 g/dL

    آستانه‌ها:
    - Hb < 10: هشدار (زیر هدف)
    - Hb < 8: بحرانی (نیاز به مداخله فوری)
    - Hb > 13: بالا (ریسک Thrombosis با ESA)
    """
    name = "LOW_HB"
    category = AlertCategory.LAB

    def evaluate(self, context: RuleContext) -> RuleResult:
        hb_val = context.get_lab_value(LabTestCode.HEMOGLOBIN.value)
        if hb_val is None:
            return self._no_trigger()

        lab_info = context.latest_labs.get(LabTestCode.HEMOGLOBIN.value, {})
        lab_date = lab_info.get("date", "نامشخص")

        # اطلاعات آهن برای context
        ferritin = context.get_lab_value(LabTestCode.FERRITIN.value)
        tsat = context.get_lab_value(LabTestCode.TSAT.value)
        iron_status = ""
        if ferritin is not None and tsat is not None:
            if ferritin < 200 and tsat < 20:
                iron_status = " (کمبود آهن محتمل — Ferritin و TSAT پایین)"
            elif ferritin >= 500 and tsat < 20:
                iron_status = " (ADOS: کمبود آهن عملکردی با التهاب)"

        if hb_val < LAB_THRESHOLDS.hb_critical_low:
            return self._make_triggered(
                severity=AlertSeverity.HIGH,
                title=f"🚨 کم‌خونی شدید: Hb = {hb_val} g/dL",
                clinician_explanation=(
                    f"هموگلوبین = {hb_val} g/dL (تاریخ: {lab_date}) — "
                    f"زیر {LAB_THRESHOLDS.hb_critical_low} g/dL.{iron_status} "
                    f"ریسک: تاکی‌کاردی، بار قلبی، کاهش عملکرد. "
                    f"بررسی فوری وضعیت آهن (Ferritin، TSAT)، دوز ESA، "
                    f"و احتمال خونریزی مخفی."
                ),
                evidence={
                    "hb_value": hb_val,
                    "lab_date": lab_date,
                    "ferritin": ferritin,
                    "tsat": tsat,
                    "threshold_critical": LAB_THRESHOLDS.hb_critical_low,
                },
                education_topic="LOW_HB",
                recommendation_draft=(
                    f"📋 کم‌خونی شدید — {context.patient_full_name}\n\n"
                    f"Hb = {hb_val} g/dL{iron_status}\n\n"
                    f"پیشنهاد بررسی:\n"
                    f"• وضعیت آهن: Ferritin={ferritin or '؟'}, TSAT={tsat or '؟'}%\n"
                    f"• آیا نیاز به آهن IV دارد؟\n"
                    f"• بررسی دوز ESA (Erythropoiesis-Stimulating Agent)\n"
                    f"• رد خونریزی مخفی (GI، دسترسی عروقی)\n"
                    f"• بررسی علل ثانویه (التهاب، نارسایی غدد، کمبود B12/Folate)"
                ),
                patient_message_draft=(
                    f"آزمایش اخیر نشان داد کم‌خونی شما ({hb_val} g/dL) "
                    f"بیشتر از حد نگران‌کننده شده است. "
                    f"پزشک شما درمان لازم را بررسی خواهد کرد. "
                    f"اگر احساس ضعف شدید، تپش قلب یا تنگی نفس دارید، "
                    f"سریعاً اطلاع دهید."
                ),
            )

        if hb_val < LAB_THRESHOLDS.hb_target_low:
            return self._make_triggered(
                severity=AlertSeverity.MEDIUM,
                title=f"کم‌خونی: Hb = {hb_val} g/dL",
                clinician_explanation=(
                    f"هموگلوبین = {hb_val} g/dL — "
                    f"زیر هدف ({LAB_THRESHOLDS.hb_target_low} g/dL).{iron_status} "
                    f"بررسی وضعیت آهن و ESA توصیه می‌شود."
                ),
                evidence={
                    "hb_value": hb_val,
                    "lab_date": lab_date,
                    "ferritin": ferritin,
                    "tsat": tsat,
                },
                education_topic="LOW_HB",
                recommendation_draft=(
                    f"📋 کم‌خونی — {context.patient_full_name}\n\n"
                    f"Hb = {hb_val} g/dL (هدف >= {LAB_THRESHOLDS.hb_target_low})\n\n"
                    f"پیشنهاد: بررسی آهن + ارزیابی ESA"
                ),
                patient_message_draft=(
                    f"خون‌سازی شما ({hb_val} g/dL) کمتر از حد مطلوب است. "
                    f"پزشک وضعیت شما را بررسی خواهد کرد. "
                    f"اگر خیلی خسته یا رنگ‌پریده هستید، اطلاع دهید."
                ),
            )

        # Hb > 13: بالا (ریسک Thrombosis با ESA)
        if hb_val > LAB_THRESHOLDS.hb_target_high:
            return self._make_triggered(
                severity=AlertSeverity.MEDIUM,
                title=f"هموگلوبین بالاتر از هدف: {hb_val} g/dL",
                clinician_explanation=(
                    f"Hb = {hb_val} g/dL — بالاتر از هدف {LAB_THRESHOLDS.hb_target_high} g/dL. "
                    f"ریسک: Thrombosis، Stroke، MI (مخصوصاً اگر با ESA درمان می‌شود). "
                    f"بررسی دوز ESA و کاهش آن."
                ),
                evidence={"hb_value": hb_val, "lab_date": lab_date},
                recommendation_draft=(
                    f"📋 Hb بالاتر از هدف — {context.patient_full_name}\n\n"
                    f"Hb = {hb_val} g/dL\n\n"
                    f"پیشنهاد: بررسی و احتمالاً کاهش دوز ESA"
                ),
            )

        return self._no_trigger()


class AnemiaTrendRule(BaseRule):
    """
    روند نزولی هموگلوبین

    حتی اگر Hb هنوز از threshold رد نشده،
    روند نزولی در 3+ آزمایش نشانه هشدار است.
    """
    name = "HB_DECLINING_TREND"
    category = AlertCategory.LAB
    MIN_DATA_POINTS = 3

    def evaluate(self, context: RuleContext) -> RuleResult:
        hb_history = context.get_lab_history_values(
            LabTestCode.HEMOGLOBIN.value,
            n=self.MIN_DATA_POINTS,
        )

        if len(hb_history) < self.MIN_DATA_POINTS:
            return self._no_trigger()

        slope = calculate_slope(hb_history)

        # شیب منفی معنی‌دار: بیشتر از 0.3 g/dL در هر آزمایش
        DECLINE_THRESHOLD = -0.3

        if slope >= DECLINE_THRESHOLD:
            return self._no_trigger()

        current_hb = hb_history[-1]
        predicted_next = current_hb + slope  # پیش‌بینی ساده

        concern_note = ""
        if predicted_next < LAB_THRESHOLDS.hb_target_low:
            concern_note = (
                f" پیش‌بینی: اگر روند ادامه یابد، Hb بعدی "
                f"احتمالاً {predicted_next:.1f} g/dL خواهد بود."
            )

        return self._make_triggered(
            severity=AlertSeverity.MEDIUM,
            title=(
                f"روند نزولی Hb: {hb_history[0]:.1f} → "
                f"{current_hb:.1f} g/dL"
            ),
            clinician_explanation=(
                f"هموگلوبین در {self.MIN_DATA_POINTS} آزمایش اخیر روند نزولی دارد "
                f"(شیب: {slope:.2f} g/dL/آزمایش). "
                f"مقادیر: {' → '.join(str(round(v, 1)) for v in hb_history)} g/dL.{concern_note} "
                f"بررسی زودهنگام وضعیت آهن و ESA توصیه می‌شود."
            ),
            evidence={
                "hb_history": [round(v, 1) for v in hb_history],
                "slope": round(slope, 3),
                "current_hb": current_hb,
                "predicted_next": round(predicted_next, 1),
                "n_points": self.MIN_DATA_POINTS,
            },
            education_topic="LOW_HB",
            recommendation_draft=(
                f"📋 روند نزولی Hb — {context.patient_full_name}\n\n"
                f"مقادیر: {' → '.join(str(round(v, 1)) for v in hb_history)} g/dL\n"
                f"شیب: {slope:.2f} g/dL/آزمایش{concern_note}\n\n"
                f"پیشنهاد بررسی زودهنگام:\n"
                f"• وضعیت آهن (Ferritin، TSAT)\n"
                f"• دوز ESA فعلی\n"
                f"• احتمال التهاب پنهان (CRP)\n"
                f"• رد خونریزی"
            ),
        )


# ============================================================
# آلبومین (Albumin)
# ============================================================

class HypoalbuminemiaRule(BaseRule):
    """
    آلبومین پایین (Hypoalbuminemia)

    آلبومین قوی‌ترین پیش‌بینی‌کننده مرگ‌ومیر در دیالیز.
    هر 1 g/dL کاهش → 50% افزایش ریسک مرگ.
    علل: سوءتغذیه، التهاب (negative acute phase reactant)،
          Protein Wasting از دیالیز، بیماری‌های همراه.

    هدف: Alb >= 4.0 g/dL (NKF-KDOQI)
    """
    name = "LOW_ALB"
    category = AlertCategory.LAB

    def evaluate(self, context: RuleContext) -> RuleResult:
        alb_val = context.get_lab_value(LabTestCode.ALBUMIN.value)
        if alb_val is None:
            return self._no_trigger()

        lab_info = context.latest_labs.get(LabTestCode.ALBUMIN.value, {})
        lab_date = lab_info.get("date", "نامشخص")

        # بررسی CRP برای تفکیک التهاب از سوءتغذیه خالص
        crp = context.get_lab_value(LabTestCode.CRP.value)
        inflammation_note = ""
        if crp and crp > 10:
            inflammation_note = (
                f" توجه: CRP = {crp} mg/L — آلبومین پایین احتمالاً "
                f"ناشی از التهاب (نه فقط سوءتغذیه) است."
            )

        if alb_val < LAB_THRESHOLDS.alb_critical_low:
            return self._make_triggered(
                severity=AlertSeverity.HIGH,
                title=f"🚨 آلبومین بحرانی: {alb_val} g/dL",
                clinician_explanation=(
                    f"آلبومین = {alb_val} g/dL (تاریخ: {lab_date}) — "
                    f"زیر {LAB_THRESHOLDS.alb_critical_low} g/dL.{inflammation_note} "
                    f"ریسک بسیار بالا: عفونت، ادم، مرگ‌ومیر. "
                    f"ارزیابی تغذیه‌ای فوری و بررسی علل."
                ),
                evidence={
                    "alb_value": alb_val,
                    "lab_date": lab_date,
                    "crp": crp,
                    "threshold_critical": LAB_THRESHOLDS.alb_critical_low,
                },
                education_topic="LOW_ALB",
                recommendation_draft=(
                    f"📋 Hypoalbuminemia بحرانی — {context.patient_full_name}\n\n"
                    f"Alb = {alb_val} g/dL{f', CRP = {crp}' if crp else ''}\n\n"
                    f"پیشنهاد بررسی:\n"
                    f"• ارزیابی تغذیه‌ای جامع (Dietitian)\n"
                    f"• بررسی التهاب (CRP، ESR) و علت آن\n"
                    f"• بررسی Protein Loss از دیالیز\n"
                    f"• رد علل ثانویه (بیماری کبد، Nephrotic syndrome)\n"
                    f"• تکمیل پروتئین خوراکی یا ONS (Oral Nutritional Supplement)"
                ),
                patient_message_draft=(
                    f"آزمایش نشان داد پروتئین خون شما (آلبومین: {alb_val} g/dL) "
                    f"پایین‌تر از حد مطلوب است. "
                    f"این نشانه مهمی است که باید بررسی شود. "
                    f"پزشک شما راهنمایی‌های تغذیه‌ای خواهد داد."
                ),
            )

        if alb_val < LAB_THRESHOLDS.alb_normal_low:
            return self._make_triggered(
                severity=AlertSeverity.MEDIUM,
                title=f"آلبومین پایین: {alb_val} g/dL",
                clinician_explanation=(
                    f"آلبومین = {alb_val} g/dL — "
                    f"زیر {LAB_THRESHOLDS.alb_normal_low} g/dL.{inflammation_note} "
                    f"بررسی وضعیت تغذیه‌ای توصیه می‌شود."
                ),
                evidence={
                    "alb_value": alb_val,
                    "lab_date": lab_date,
                    "crp": crp,
                },
                education_topic="LOW_ALB",
                recommendation_draft=(
                    f"📋 آلبومین پایین — {context.patient_full_name}\n\n"
                    f"Alb = {alb_val} g/dL\n\n"
                    f"پیشنهاد: ارزیابی تغذیه + بررسی التهاب"
                ),
                patient_message_draft=(
                    f"پروتئین خون شما (آلبومین: {alb_val} g/dL) کمتر از حد مطلوب است. "
                    f"سعی کنید از منابع پروتئینی مناسب (مرغ، ماهی، تخم‌مرغ) "
                    f"به اندازه کافی مصرف کنید."
                ),
            )

        return self._no_trigger()


# ============================================================
# ترکیبی (Cross-domain Lab Rules)
# ============================================================

class IronDeficiencyRule(BaseRule):
    """
    کمبود آهن (Iron Deficiency)

    سه الگوی مهم:
    1. کمبود مطلق: Ferritin < 100 + TSAT < 20%
    2. کمبود عملکردی (ADOS): Ferritin >= 500 + TSAT < 20%
    3. اشباع بیش از حد: TSAT > 50% (ریسک Oxidative Stress)

    هدف KDIGO:
    - Ferritin: 200-800 ng/mL
    - TSAT: 20-50%
    """
    name = "IRON_DEFICIENCY"
    category = AlertCategory.LAB

    def evaluate(self, context: RuleContext) -> RuleResult:
        ferritin = context.get_lab_value(LabTestCode.FERRITIN.value)
        tsat = context.get_lab_value(LabTestCode.TSAT.value)

        if ferritin is None or tsat is None:
            return self._no_trigger()

        ferritin_date = context.latest_labs.get(
            LabTestCode.FERRITIN.value, {}
        ).get("date", "نامشخص")

        hb_val = context.get_lab_value(LabTestCode.HEMOGLOBIN.value)

        # کمبود مطلق آهن
        if ferritin < 100 and tsat < 20:
            anemia_note = (
                f" (همراه با کم‌خونی: Hb = {hb_val} g/dL)"
                if hb_val and hb_val < LAB_THRESHOLDS.hb_target_low
                else ""
            )
            return self._make_triggered(
                severity=AlertSeverity.HIGH,
                title=f"کمبود آهن مطلق: Ferritin={ferritin}, TSAT={tsat}%",
                clinician_explanation=(
                    f"کمبود آهن مطلق: Ferritin = {ferritin} ng/mL، "
                    f"TSAT = {tsat}%.{anemia_note} "
                    f"نیاز به آهن درمانی IV قبل از تنظیم ESA. "
                    f"توجه: آهن خوراکی در بیماران دیالیزی معمولاً کافی نیست."
                ),
                evidence={
                    "ferritin": ferritin,
                    "tsat": tsat,
                    "hb": hb_val,
                    "date": ferritin_date,
                    "pattern": "absolute_iron_deficiency",
                },
                recommendation_draft=(
                    f"📋 کمبود آهن مطلق — {context.patient_full_name}\n\n"
                    f"Ferritin = {ferritin}, TSAT = {tsat}%"
                    f"{f', Hb = {hb_val}' if hb_val else ''}\n\n"
                    f"پیشنهاد:\n"
                    f"• آهن درمانی IV (Iron Sucrose یا Ferric Carboxymaltose)\n"
                    f"• بررسی مجدد Ferritin و TSAT پس از درمان\n"
                    f"• سپس ارزیابی نیاز به ESA"
                ),
            )

        # کمبود عملکردی (ADOS)
        if ferritin >= 500 and tsat < 20:
            crp = context.get_lab_value(LabTestCode.CRP.value)
            return self._make_triggered(
                severity=AlertSeverity.MEDIUM,
                title=f"کمبود آهن عملکردی (ADOS): TSAT={tsat}%",
                clinician_explanation=(
                    f"ADOS pattern: Ferritin = {ferritin} (بالا/طبیعی) "
                    f"+ TSAT = {tsat}% (پایین). "
                    f"{'CRP = ' + str(crp) + ' — التهاب مانع استفاده از آهن ذخیره است. ' if crp else ''}"
                    f"آهن درمانی با احتیاط و بررسی التهاب توصیه می‌شود."
                ),
                evidence={
                    "ferritin": ferritin,
                    "tsat": tsat,
                    "crp": crp,
                    "pattern": "ADOS",
                },
                recommendation_draft=(
                    f"📋 ADOS Pattern — {context.patient_full_name}\n\n"
                    f"Ferritin = {ferritin}, TSAT = {tsat}%\n\n"
                    f"پیشنهاد: بررسی و درمان التهاب اولیه + "
                    f"تصمیم درباره آهن IV با احتیاط"
                ),
            )

        # اشباع بیش از حد
        if tsat > 50:
            return self._make_triggered(
                severity=AlertSeverity.MEDIUM,
                title=f"اشباع بیش از حد آهن: TSAT={tsat}%",
                clinician_explanation=(
                    f"TSAT = {tsat}% — بالاتر از 50%. "
                    f"ریسک Oxidative Stress و Iron Toxicity. "
                    f"توقف موقت آهن درمانی توصیه می‌شود."
                ),
                evidence={"ferritin": ferritin, "tsat": tsat},
                recommendation_draft=(
                    f"📋 Iron Overload — {context.patient_full_name}\n\n"
                    f"TSAT = {tsat}%\n\nپیشنهاد: توقف موقت آهن IV"
                ),
            )

        return self._no_trigger()


class RenalOsteodystrophyRule(BaseRule):
    """
    الگوی Renal Osteodystrophy / CKD-MBD

    ترکیب: Ca پایین + P بالا + PTH بسیار بالا
    → بیماری استخوان-معدنی کلیه (CKD-MBD)

    KDIGO CKD-MBD Guidelines:
    - PTH هدف: 2-9× بالای حد نرمال (معمولاً 150-600 pg/mL)
    - PTH > 800: Secondary Hyperparathyroidism شدید
    """
    name = "RENAL_OSTEODYSTROPHY"
    category = AlertCategory.LAB

    def evaluate(self, context: RuleContext) -> RuleResult:
        ca_val = context.get_lab_value(LabTestCode.CALCIUM.value)
        p_val = context.get_lab_value(LabTestCode.PHOSPHORUS.value)
        pth_val = context.get_lab_value(LabTestCode.PTH.value)

        if not all([ca_val, p_val, pth_val]):
            return self._no_trigger()

        # الگوی کلاسیک CKD-MBD
        low_ca = ca_val < 8.5
        high_p = p_val > 5.5
        very_high_pth = pth_val > 800

        if not (high_p and very_high_pth):
            return self._no_trigger()

        severity = AlertSeverity.HIGH if very_high_pth and low_ca else AlertSeverity.MEDIUM

        ca_p_product = round(ca_val * p_val, 1)

        return self._make_triggered(
            severity=severity,
            title=(
                f"الگوی CKD-MBD: PTH={pth_val:.0f}, "
                f"P={p_val}, Ca={ca_val}"
            ),
            clinician_explanation=(
                f"الگوی CKD-MBD / Renal Osteodystrophy: "
                f"Ca = {ca_val} mg/dL{'(پایین)' if low_ca else ''}, "
                f"P = {p_val} mg/dL (بالا), "
                f"PTH = {pth_val:.0f} pg/mL (بسیار بالا). "
                f"Ca×P = {ca_p_product} mg²/dL². "
                f"ریسک: استئوپروز، Fracture، Vascular Calcification. "
                f"بررسی و مدیریت CKD-MBD با متخصص لازم است."
            ),
            evidence={
                "calcium": ca_val,
                "phosphorus": p_val,
                "pth": pth_val,
                "ca_p_product": ca_p_product,
                "pattern": "CKD_MBD",
            },
            recommendation_draft=(
                f"📋 CKD-MBD / Renal Osteodystrophy — "
                f"{context.patient_full_name}\n\n"
                f"Ca = {ca_val}, P = {p_val}, PTH = {pth_val:.0f}\n"
                f"Ca×P = {ca_p_product}\n\n"
                f"پیشنهاد بررسی:\n"
                f"• بررسی نوع و دوز Vitamin D Analog (Calcitriol/Paricalcitol)\n"
                f"• بررسی Cinacalcet در صورت PTH بالا + Ca طبیعی/بالا\n"
                f"• کنترل فسفر (بایندر + رژیم)\n"
                f"• در PTH > 800 مداوم: ارزیابی Parathyroidectomy\n"
                f"• DEXA Scan برای ارزیابی تراکم استخوان"
            ),
            patient_message_draft=(
                f"آزمایش‌های شما (کلسیم، فسفر، PTH) نشان‌دهنده "
                f"مشکل در سوخت‌وساز استخوان مرتبط با بیماری کلیه است. "
                f"پزشک درمان مناسب را تنظیم خواهد کرد. "
                f"مصرف داروهای تجویزشده و رعایت رژیم فسفر را جدی بگیرید."
            ),
        )


class CaPProductRule(BaseRule):
    """
    Ca × P Product بالا

    Ca × P > 55 mg²/dL² → ریسک Vascular Calcification
    (حتی اگر Ca و P به تنهایی در محدوده هشدار نباشند)
    """
    name = "CA_P_PRODUCT_HIGH"
    category = AlertCategory.LAB

    def evaluate(self, context: RuleContext) -> RuleResult:
        ca_val = context.get_lab_value(LabTestCode.CALCIUM.value)
        p_val = context.get_lab_value(LabTestCode.PHOSPHORUS.value)

        if ca_val is None or p_val is None:
            return self._no_trigger()

        product = round(ca_val * p_val, 1)

        if product <= 55:
            return self._no_trigger()

        severity = (
            AlertSeverity.HIGH
            if product > 72
            else AlertSeverity.MEDIUM
        )

        return self._make_triggered(
            severity=severity,
            title=f"Ca×P Product بالا: {product} mg²/dL²",
            clinician_explanation=(
                f"Ca×P Product = {product} mg²/dL² "
                f"(Ca={ca_val}, P={p_val}). "
                f"بالاتر از 55: ریسک Vascular Calcification. "
                f"کنترل همزمان Ca و P توصیه می‌شود."
            ),
            evidence={
                "calcium": ca_val,
                "phosphorus": p_val,
                "ca_p_product": product,
                "threshold": 55,
            },
            recommendation_draft=(
                f"📋 Ca×P بالا — {context.patient_full_name}\n\n"
                f"Ca×P = {product} (Ca={ca_val}, P={p_val})\n\n"
                f"پیشنهاد: کنترل P + بررسی Ca + ارزیابی CKD-MBD"
            ),
        )


class InflammationVsMalnutritionRule(BaseRule):
    """
    التهاب در مقابل سوءتغذیه (Alb پایین + CRP بالا)

    آلبومین پایین می‌تواند از دو علت باشد:
    1. سوءتغذیه خالص
    2. التهاب سیستمیک (CRP بالا → پروتئین منفی فاز حاد)

    تفکیک این دو برای درمان مهم است.
    """
    name = "INFLAMMATION_VS_MALNUTRITION"
    category = AlertCategory.LAB

    def evaluate(self, context: RuleContext) -> RuleResult:
        alb_val = context.get_lab_value(LabTestCode.ALBUMIN.value)
        crp_val = context.get_lab_value(LabTestCode.CRP.value)

        if alb_val is None or crp_val is None:
            return self._no_trigger()

        # فقط اگر هر دو ناهنجار باشند
        if alb_val >= LAB_THRESHOLDS.alb_normal_low or crp_val <= 10:
            return self._no_trigger()

        alb_date = context.latest_labs.get(
            LabTestCode.ALBUMIN.value, {}
        ).get("date", "نامشخص")

        return self._make_triggered(
            severity=AlertSeverity.MEDIUM,
            title=f"التهاب + آلبومین پایین: Alb={alb_val}, CRP={crp_val}",
            clinician_explanation=(
                f"آلبومین = {alb_val} g/dL + CRP = {crp_val} mg/L. "
                f"آلبومین پایین احتمالاً ناشی از التهاب سیستمیک است "
                f"(نه فقط سوءتغذیه). "
                f"بررسی علت التهاب (عفونت دسترسی عروقی، عفونت سیستمیک، "
                f"بیماری التهابی) ضروری است."
            ),
            evidence={
                "albumin": alb_val,
                "crp": crp_val,
                "lab_date": alb_date,
                "interpretation": "inflammation_driven_hypoalbuminemia",
            },
            recommendation_draft=(
                f"📋 التهاب + Hypoalbuminemia — {context.patient_full_name}\n\n"
                f"Alb = {alb_val} g/dL، CRP = {crp_val} mg/L\n\n"
                f"پیشنهاد بررسی:\n"
                f"• بررسی دسترسی عروقی (عفونت/ترومبوز)\n"
                f"• کشت خون در صورت تب یا علائم سپسیس\n"
                f"• بررسی سایر کانون‌های التهابی\n"
                f"• مکمل تغذیه‌ای در صورت نیاز (پس از کنترل التهاب)"
            ),
        )