"""
پایه Rule Engine

طراحی اصول:
- هر Rule مستقل و قابل تست جداگانه است
- خروجی همیشه RuleResult است (نه exception)
- هر Rule نام یکتا دارد (برای audit و debug)
- Rules می‌توانند به تاریخچه نیاز داشته باشند (context)
- هیچ Rule مستقیماً DB می‌نویسد — فقط RuleResult برمی‌گرداند
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Optional

from app.shared.enums import AlertCategory, AlertSeverity


@dataclass
class RuleResult:
    """
    خروجی یک قانون

    Attributes:
        triggered: آیا هشدار فعال شد؟
        severity: سطح هشدار (فقط اگر triggered=True)
        category: دسته‌بندی هشدار
        rule_name: نام یکتای قانون (برای audit)
        title: عنوان کوتاه هشدار (فارسی)
        clinician_explanation: توضیح کامل برای کلینیسین (فارسی)
        evidence: داده‌هایی که هشدار را ایجاد کردند
        education_topic: کد محتوای آموزشی پیشنهادی
        recommendation_draft: پیش‌نویس پیشنهاد برای پزشک
        patient_message_draft: پیش‌نویس پیام برای بیمار
    """
    triggered: bool
    category: AlertCategory
    rule_name: str

    # فقط اگر triggered=True معنا دارد
    severity: Optional[AlertSeverity] = None
    title: str = ""
    clinician_explanation: str = ""
    evidence: dict[str, Any] = field(default_factory=dict)
    education_topic: Optional[str] = None
    recommendation_draft: Optional[str] = None
    patient_message_draft: Optional[str] = None

    def __post_init__(self):
        if self.triggered and self.severity is None:
            raise ValueError(
                f"Rule '{self.rule_name}': "
                f"severity باید هنگام triggered=True مشخص باشد"
            )

    @classmethod
    def no_trigger(
        cls,
        rule_name: str,
        category: AlertCategory,
    ) -> "RuleResult":
        """Factory method برای حالت عدم فعال‌سازی"""
        return cls(
            triggered=False,
            category=category,
            rule_name=rule_name,
        )


@dataclass
class RuleContext:
    """
    Context کامل برای اجرای Rules

    شامل تمام داده‌های لازم برای تحلیل.
    Rules نباید مستقیماً به DB دسترسی داشته باشند —
    همه داده‌ها از Context می‌آیند.
    """
    patient_id: str
    patient_full_name: str
    dry_weight: float

    # داده جلسه جاری (اگر trigger از session بود)
    current_session: Optional[dict] = None

    # تاریخچه جلسات (جدیدترین اول)
    recent_sessions: list[dict] = field(default_factory=list)

    # آخرین آزمایش‌ها {test_code: {value, date, is_critical}}
    latest_labs: dict[str, dict] = field(default_factory=dict)

    # تاریخچه آزمایش یک تست {test_code: [{date, value}]}
    lab_history: dict[str, list[dict]] = field(default_factory=dict)

    # گزارش علائم اخیر
    recent_symptoms: list[dict] = field(default_factory=list)

    # خلاصه مایعات (میانگین ۷ روز)
    fluid_summary: Optional[dict] = None

    # خلاصه رژیم غذایی (۳۰ روز)
    diet_summary: Optional[dict] = None

    def get_lab_value(self, test_code: str) -> Optional[float]:
        """دریافت آخرین مقدار یک آزمایش"""
        lab = self.latest_labs.get(test_code)
        return lab.get("value") if lab else None

    def get_lab_history_values(
        self,
        test_code: str,
        n: int = 4,
    ) -> list[float]:
        """لیست مقادیر تاریخچه یک آزمایش (جدیدترین آخر)"""
        history = self.lab_history.get(test_code, [])
        # مرتب از قدیم به جدید
        sorted_h = sorted(history, key=lambda x: x["date"])
        return [h["value"] for h in sorted_h[-n:]]

    def get_recent_pre_systolics(self, n: int = 4) -> list[float]:
        """لیست فشار سیستولیک قبل دیالیز در n جلسه اخیر"""
        result = []
        for s in reversed(self.recent_sessions[:n]):
            if s.get("bp_pre_systolic") is not None:
                result.append(float(s["bp_pre_systolic"]))
        return result

    def get_recent_idwg_percents(self, n: int = 4) -> list[float]:
        """لیست IDWG درصد در n جلسه اخیر"""
        result = []
        for s in reversed(self.recent_sessions[:n]):
            if s.get("weight_gain_percent") is not None:
                result.append(float(s["weight_gain_percent"]))
        return result


class BaseRule(ABC):
    """
    کلاس پایه تمام Rules

    هر Rule باید:
    1. name یکتا داشته باشد
    2. category مشخص داشته باشد
    3. متد evaluate را پیاده‌سازی کند
    4. هرگز exception throw نکند — همیشه RuleResult برگرداند
    """
    name: str
    category: AlertCategory

    def safe_evaluate(self, context: RuleContext) -> RuleResult:
        """
        اجرای ایمن Rule با try/except

        اگر Rule دچار خطا شد، no_trigger برمی‌گرداند
        (بهتر از crash کردن کل pipeline)
        """
        try:
            return self.evaluate(context)
        except Exception as exc:
            import logging
            logging.getLogger(__name__).error(
                f"Rule '{self.name}' خطا داد: {exc}",
                exc_info=True,
            )
            return RuleResult.no_trigger(self.name, self.category)

    @abstractmethod
    def evaluate(self, context: RuleContext) -> RuleResult:
        """
        منطق اصلی Rule

        Args:
            context: تمام داده‌های لازم

        Returns:
            RuleResult — هیچ‌وقت None یا Exception نه
        """
        pass

    def _make_triggered(
        self,
        severity: AlertSeverity,
        title: str,
        clinician_explanation: str,
        evidence: dict,
        education_topic: Optional[str] = None,
        recommendation_draft: Optional[str] = None,
        patient_message_draft: Optional[str] = None,
    ) -> RuleResult:
        """Helper برای ساختن RuleResult triggered"""
        return RuleResult(
            triggered=True,
            category=self.category,
            rule_name=self.name,
            severity=severity,
            title=title,
            clinician_explanation=clinician_explanation,
            evidence=evidence,
            education_topic=education_topic,
            recommendation_draft=recommendation_draft,
            patient_message_draft=patient_message_draft,
        )

    def _no_trigger(self) -> RuleResult:
        """Helper برای حالت عدم فعال‌سازی"""
        return RuleResult.no_trigger(self.name, self.category)