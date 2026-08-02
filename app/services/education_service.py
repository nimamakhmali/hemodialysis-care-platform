"""
سرویس محتوای آموزشی

آموزش‌های متنی شخصی‌سازی‌شده بر اساس وضعیت بیمار.
محتوا از کتابخانه آموزشی انتخاب می‌شود و بر اساس
هشدارهای فعال و آزمایش‌های اخیر فیلتر می‌شود.
"""

import uuid
from typing import Optional

from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.education_content import EducationContent
from app.models.lab_result import LabResult, LabPanel
from app.shared.enums import AlertStatus, LabTestCode


class EducationService:

    # ============================================================
    # GET
    # ============================================================

    def get_content_by_topic(
        self,
        db: Session,
        topic_code: str,
    ) -> Optional[EducationContent]:
        """دریافت محتوا با کد موضوع"""
        return db.query(EducationContent).filter(
            EducationContent.topic_code == topic_code,
            EducationContent.is_active == True,
        ).first()

    def get_all_content(
        self,
        db: Session,
        active_only: bool = True,
        page: int = 1,
        size: int = 50,
    ) -> tuple[list[EducationContent], int]:
        """همه محتواهای آموزشی"""
        query = db.query(EducationContent)
        if active_only:
            query = query.filter(EducationContent.is_active == True)

        total = query.count()
        contents = (
            query
            .order_by(EducationContent.title_fa)
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )

        return contents, total

    def search_education(
        self,
        db: Session,
        query_str: str,
        tags: Optional[list[str]] = None,
        active_only: bool = True,
    ) -> list[EducationContent]:
        """
        جستجو در محتوای آموزشی

        جستجو در عنوان و متن اصلی
        """
        search = f"%{query_str}%"
        query = db.query(EducationContent).filter(
            or_(
                EducationContent.title_fa.ilike(search),
                EducationContent.content_fa.ilike(search),
            )
        )

        if active_only:
            query = query.filter(EducationContent.is_active == True)

        return query.limit(20).all()

    # ============================================================
    # PERSONALIZATION
    # ============================================================

    def get_relevant_content(
        self,
        db: Session,
        patient_id: uuid.UUID,
        max_items: int = 5,
    ) -> list[EducationContent]:
        """
        محتوای مرتبط با وضعیت فعلی بیمار

        الگوریتم:
        1. هشدارهای فعال → موضوع‌های مرتبط
        2. آزمایش‌های ناهنجار → موضوع‌های مرتبط
        3. بدون تکرار
        4. اولویت: HIGH alert → MEDIUM → LOW

        این محتوا به بیمار در اپ نمایش داده می‌شود.
        """
        relevant_topics: list[tuple[str, int]] = []  # (topic_code, priority)

        # ============================================================
        # 1) هشدارهای فعال
        # ============================================================
        active_alerts = (
            db.query(Alert)
            .filter(
                Alert.patient_id == patient_id,
                Alert.status != AlertStatus.RESOLVED,
            )
            .order_by(desc(Alert.created_at))
            .limit(10)
            .all()
        )

        for alert in active_alerts:
            # نگاشت rule → topic
            topic = self._rule_to_topic(alert.triggered_by_rule)
            if topic:
                priority = (
                    0 if alert.severity.value == "high"
                    else 1 if alert.severity.value == "medium"
                    else 2
                )
                relevant_topics.append((topic, priority))

        # ============================================================
        # 2) آزمایش‌های ناهنجار اخیر
        # ============================================================
        recent_abnormal = (
            db.query(LabResult)
            .join(LabPanel)
            .filter(
                LabResult.patient_id == patient_id,
                LabResult.is_abnormal == True,
            )
            .order_by(desc(LabPanel.collected_at))
            .limit(15)
            .all()
        )

        for result in recent_abnormal:
            topic = self._lab_to_topic(
                result.test_code,
                result.abnormality_direction,
            )
            if topic:
                priority = 0 if result.is_critical else 1
                relevant_topics.append((topic, priority))

        # ============================================================
        # 3) حذف تکراری و مرتب‌سازی
        # ============================================================
        seen_topics: set[str] = set()
        unique_topics: list[tuple[str, int]] = []

        for topic, priority in sorted(relevant_topics, key=lambda x: x[1]):
            if topic not in seen_topics:
                seen_topics.add(topic)
                unique_topics.append((topic, priority))

        # ============================================================
        # 4) دریافت محتوا از DB
        # ============================================================
        result_contents: list[EducationContent] = []
        seen_ids: set[str] = set()

        for topic_code, _ in unique_topics[:max_items]:
            content = self.get_content_by_topic(db, topic_code)
            if content and str(content.id) not in seen_ids:
                result_contents.append(content)
                seen_ids.add(str(content.id))

        # اگر کافی نبود، محتوای عمومی اضافه کن
        if len(result_contents) < max_items:
            general = self._get_general_content(
                db=db,
                exclude_ids=seen_ids,
                limit=max_items - len(result_contents),
            )
            result_contents.extend(general)

        return result_contents[:max_items]

    def _rule_to_topic(self, rule_name: str) -> Optional[str]:
        """نگاشت نام Rule به کد موضوع آموزشی"""
        RULE_TOPIC_MAP = {
            "HIGH_K": "HIGH_K",
            "LOW_K": "LOW_K",
            "HIGH_P": "HIGH_P",
            "HIGH_P_POOR_DIET": "HIGH_P_BINDER",
            "HYPERPHOSPHATEMIA_WITH_POOR_DIET": "HIGH_P_BINDER",
            "LOW_HB": "LOW_HB",
            "HB_DECLINING_TREND": "LOW_HB",
            "LOW_ALB": "LOW_ALB",
            "IDWG_WARNING": "HIGH_IDWG",
            "IDWG_CRITICAL": "HIGH_IDWG",
            "IDWG_CONSECUTIVE_HIGH": "HIGH_IDWG",
            "BP_PRE_HYPERTENSION": "HIGH_BP",
            "BP_TREND": "HIGH_BP",
            "IDH_DETECTED": "IDH",
            "IRON_DEFICIENCY": "IRON_DEFICIENCY",
            "RENAL_OSTEODYSTROPHY": "CKD_MBD",
            "FLUID_OVERLOAD_PATTERN": "HIGH_IDWG",
            "MALNUTRITION_RISK": "LOW_ALB",
            "ACCESS_SITE_CONCERN": "ACCESS_CARE",
            "DANGER_SYMPTOM": "EMERGENCY_SIGNS",
            "DANGER_SYMPTOM_IMMEDIATE": "EMERGENCY_SIGNS",
        }
        return RULE_TOPIC_MAP.get(rule_name)

    def _lab_to_topic(
        self,
        test_code: str,
        direction: Optional[str],
    ) -> Optional[str]:
        """نگاشت کد آزمایش به موضوع آموزشی"""
        LAB_TOPIC_MAP = {
            ("K", "high"): "HIGH_K",
            ("K", "low"): "LOW_K",
            ("P", "high"): "HIGH_P",
            ("Hb", "low"): "LOW_HB",
            ("Alb", "low"): "LOW_ALB",
            ("Ca", "high"): "CKD_MBD",
            ("Ca", "low"): "CKD_MBD",
            ("PTH", "high"): "CKD_MBD",
            ("CRP", "high"): "INFLAMMATION",
        }
        key = (test_code, direction) if direction else (test_code, None)
        result = LAB_TOPIC_MAP.get(key)
        if not result and direction:
            # fallback بدون direction
            result = LAB_TOPIC_MAP.get((test_code, None))
        return result

    def _get_general_content(
        self,
        db: Session,
        exclude_ids: set[str],
        limit: int = 3,
    ) -> list[EducationContent]:
        """محتوای عمومی برای تکمیل لیست"""
        GENERAL_TOPICS = [
            "FLUID_RESTRICTION_BASICS",
            "DIET_BASICS_DIALYSIS",
            "MEDICATION_ADHERENCE",
            "EXERCISE_DIALYSIS",
        ]

        results = []
        for topic in GENERAL_TOPICS:
            if len(results) >= limit:
                break
            content = db.query(EducationContent).filter(
                EducationContent.topic_code == topic,
                EducationContent.is_active == True,
            ).first()

            if content and str(content.id) not in exclude_ids:
                results.append(content)

        return results

    # ============================================================
    # CRUD (admin)
    # ============================================================

    def create_content(
        self,
        db: Session,
        topic_code: str,
        title_fa: str,
        content_fa: str,
        tags: Optional[list[str]] = None,
        trigger_conditions: Optional[dict] = None,
        created_by: Optional[uuid.UUID] = None,
    ) -> EducationContent:
        """ایجاد محتوای آموزشی جدید (فقط ادمین)"""
        # بررسی تکراری نبودن topic_code
        existing = db.query(EducationContent).filter(
            EducationContent.topic_code == topic_code
        ).first()

        if existing:
            raise ValueError(
                f"محتوای آموزشی با کد '{topic_code}' از قبل وجود دارد"
            )

        content = EducationContent(
            topic_code=topic_code,
            title_fa=title_fa,
            content_fa=content_fa,
            tags=tags or [],
            trigger_conditions=trigger_conditions or {},
            is_active=True,
        )
        db.add(content)
        db.commit()
        db.refresh(content)
        return content

    def update_content(
        self,
        db: Session,
        content_id: uuid.UUID,
        title_fa: Optional[str] = None,
        content_fa: Optional[str] = None,
        tags: Optional[list[str]] = None,
        is_active: Optional[bool] = None,
    ) -> EducationContent:
        """ویرایش محتوای آموزشی (فقط ادمین)"""
        content = db.query(EducationContent).filter(
            EducationContent.id == content_id
        ).first()

        if not content:
            raise ValueError(f"محتوای آموزشی {content_id} یافت نشد")

        if title_fa is not None:
            content.title_fa = title_fa
        if content_fa is not None:
            content.content_fa = content_fa
        if tags is not None:
            content.tags = tags
        if is_active is not None:
            content.is_active = is_active

        db.commit()
        db.refresh(content)
        return content


# Singleton
education_service = EducationService()