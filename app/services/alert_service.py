"""
سرویس مدیریت هشدارها

چرخه کامل هشدار:
NEW → ACKNOWLEDGED → RESOLVED
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Request
from sqlalchemy import desc, or_
from sqlalchemy.orm import Session, joinedload

from app.analysis.rules.base import RuleResult
from app.infrastructure.auditing.logger import audit_logger
from app.models.alert import Alert
from app.models.patient import Patient
from app.models.recommendation import Recommendation
from app.models.user import User
from app.shared.enums import (
    AlertCategory,
    AlertSeverity,
    AlertStatus,
    RecommendationStatus,
)
from app.exceptions.business_exceptions import (
    AlertNotFoundException,
    InvalidStateTransitionException,
)


class AlertService:

    # ============================================================
    # CREATE
    # ============================================================

    def create_alert_from_rule(
        self,
        db: Session,
        patient_id: uuid.UUID,
        rule_result: RuleResult,
        auto_create_recommendation: bool = True,
    ) -> Optional[Alert]:
        """
        ایجاد هشدار از نتیجه یک Rule

        مراحل:
        1. بررسی duplicate (همان rule در ۲۴ ساعت)
        2. ذخیره Alert
        3. اگر severity=HIGH یا MEDIUM → Recommendation Draft خودکار

        Returns:
            Alert ایجادشده یا None اگر duplicate بود
        """
        if not rule_result.triggered:
            return None

        # بررسی duplicate
        if self._is_duplicate(db, patient_id, rule_result.rule_name):
            return None

        alert = Alert(
            patient_id=patient_id,
            severity=rule_result.severity,
            category=rule_result.category,
            title=rule_result.title,
            clinician_explanation=rule_result.clinician_explanation,
            evidence=rule_result.evidence,
            triggered_by_rule=rule_result.rule_name,
            status=AlertStatus.NEW,
        )
        db.add(alert)
        db.flush()

        # Recommendation Draft خودکار برای HIGH و MEDIUM
        if (
            auto_create_recommendation
            and rule_result.severity in (AlertSeverity.HIGH, AlertSeverity.MEDIUM)
            and rule_result.recommendation_draft
        ):
            self._create_recommendation_draft(
                db=db,
                patient_id=patient_id,
                alert=alert,
                rule_result=rule_result,
            )

        db.commit()
        db.refresh(alert)
        return alert

    def _create_recommendation_draft(
        self,
        db: Session,
        patient_id: uuid.UUID,
        alert: Alert,
        rule_result: RuleResult,
    ) -> Recommendation:
        """ایجاد Recommendation Draft خودکار"""
        rec = Recommendation(
            patient_id=patient_id,
            alert_id=alert.id,
            draft_for_clinician=rule_result.recommendation_draft,
            patient_content=rule_result.patient_message_draft,
            education_topic=rule_result.education_topic,
            status=RecommendationStatus.DRAFT,
            priority=rule_result.severity,
        )
        db.add(rec)
        db.flush()
        return rec

    def _is_duplicate(
        self,
        db: Session,
        patient_id: uuid.UUID,
        rule_name: str,
        hours: int = 24,
    ) -> bool:
        """بررسی وجود هشدار مشابه در بازه زمانی"""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        existing = db.query(Alert).filter(
            Alert.patient_id == patient_id,
            Alert.triggered_by_rule == rule_name,
            Alert.status != AlertStatus.RESOLVED,
            Alert.created_at >= cutoff,
        ).first()
        return existing is not None

    # ============================================================
    # STATE TRANSITIONS
    # ============================================================

    def acknowledge_alert(
        self,
        db: Session,
        alert_id: uuid.UUID,
        clinician: User,
        note: Optional[str] = None,
        request: Optional[Request] = None,
    ) -> Alert:
        """
        تأیید دیده‌شدن هشدار: NEW → ACKNOWLEDGED

        فقط از NEW می‌توان acknowledge کرد.
        """
        alert = self._get_alert_or_raise(db, alert_id)

        if alert.status == AlertStatus.ACKNOWLEDGED:
            return alert  # idempotent

        if alert.status == AlertStatus.RESOLVED:
            raise InvalidStateTransitionException(
                "هشدار بسته‌شده قابل تأیید نیست"
            )

        old_status = alert.status
        alert.status = AlertStatus.ACKNOWLEDGED
        alert.acknowledged_by = clinician.id
        alert.acknowledged_at = datetime.now(timezone.utc)

        audit_logger.log(
            db=db,
            action="ACKNOWLEDGE_ALERT",
            entity_type="Alert",
            entity_id=str(alert.id),
            user_id=clinician.id,
            old_values={"status": old_status.value},
            new_values={
                "status": AlertStatus.ACKNOWLEDGED.value,
                "note": note,
            },
            request=request,
        )

        db.commit()
        db.refresh(alert)
        return alert

    def resolve_alert(
        self,
        db: Session,
        alert_id: uuid.UUID,
        clinician: User,
        resolution_note: Optional[str] = None,
        request: Optional[Request] = None,
    ) -> Alert:
        """
        بستن هشدار: ANY → RESOLVED

        پزشک می‌تواند مستقیماً هشدار را ببندد.
        """
        alert = self._get_alert_or_raise(db, alert_id)

        if alert.status == AlertStatus.RESOLVED:
            return alert  # idempotent

        old_status = alert.status
        alert.status = AlertStatus.RESOLVED
        alert.resolved_at = datetime.now(timezone.utc)

        audit_logger.log(
            db=db,
            action="RESOLVE_ALERT",
            entity_type="Alert",
            entity_id=str(alert.id),
            user_id=clinician.id,
            old_values={"status": old_status.value},
            new_values={
                "status": AlertStatus.RESOLVED.value,
                "resolution_note": resolution_note,
            },
            request=request,
        )

        db.commit()
        db.refresh(alert)
        return alert

    # ============================================================
    # READ
    # ============================================================

    def get_patient_alerts(
        self,
        db: Session,
        patient_id: uuid.UUID,
        status: Optional[AlertStatus] = None,
        severity: Optional[AlertSeverity] = None,
        category: Optional[AlertCategory] = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Alert], int]:
        """هشدارهای یک بیمار با فیلتر"""
        query = db.query(Alert).filter(
            Alert.patient_id == patient_id
        )

        if status:
            query = query.filter(Alert.status == status)
        if severity:
            query = query.filter(Alert.severity == severity)
        if category:
            query = query.filter(Alert.category == category)

        total = query.count()
        alerts = (
            query
            .order_by(
                Alert.severity.desc(),  # HIGH اول
                desc(Alert.created_at),
            )
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )

        return alerts, total

    # ============================================================
    # app/services/alert_service.py — اصلاح مرتب‌سازی در DB
    # ============================================================

    def get_all_active_alerts(
        self,
        db: Session,
        page: int = 1,
        size: int = 50,
        severity: Optional[AlertSeverity] = None,
    ) -> tuple[list[Alert], int]:
        from sqlalchemy import case

        severity_case = case(
            (Alert.severity == AlertSeverity.HIGH, 0),
            (Alert.severity == AlertSeverity.MEDIUM, 1),
            else_=2,
        )

        query = (
            db.query(Alert)
            .filter(Alert.status != AlertStatus.RESOLVED)
        )

        if severity:
            query = query.filter(Alert.severity == severity)

        total = query.count()
        alerts = (
            query
            .order_by(severity_case, Alert.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )

        return alerts, total

    def get_alert_stats(
        self,
        db: Session,
        patient_id: Optional[uuid.UUID] = None,
    ) -> dict:
        """
        آمار هشدارها

        اگر patient_id وارد شود: آمار یک بیمار
        وگرنه: آمار کل سیستم
        """
        from sqlalchemy import func

        query = db.query(
            Alert.severity,
            Alert.status,
            func.count(Alert.id).label("count"),
        )

        if patient_id:
            query = query.filter(Alert.patient_id == patient_id)

        result = query.group_by(Alert.severity, Alert.status).all()

        stats = {
            "total": 0,
            "active": {"high": 0, "medium": 0, "low": 0},
            "acknowledged": {"high": 0, "medium": 0, "low": 0},
            "resolved_today": 0,
        }

        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        for severity, status, count in result:
            stats["total"] += count
            sev = severity.value.lower()
            if status == AlertStatus.NEW:
                if sev in stats["active"]:
                    stats["active"][sev] += count
            elif status == AlertStatus.ACKNOWLEDGED:
                if sev in stats["acknowledged"]:
                    stats["acknowledged"][sev] += count

        # resolved امروز
        resolved_today_query = db.query(func.count(Alert.id)).filter(
            Alert.status == AlertStatus.RESOLVED,
            Alert.resolved_at >= today_start,
        )
        if patient_id:
            resolved_today_query = resolved_today_query.filter(
                Alert.patient_id == patient_id
            )
        stats["resolved_today"] = resolved_today_query.scalar() or 0

        return stats

    def _get_alert_or_raise(
        self,
        db: Session,
        alert_id: uuid.UUID,
    ) -> Alert:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise AlertNotFoundException(
                f"هشدار با شناسه {alert_id} یافت نشد"
            )
        return alert


# Singleton
alert_service = AlertService()