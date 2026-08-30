"""
سرویس مدیریت توصیه‌ها

چرخه:
DRAFT → APPROVED (→ PatientMessage ایجاد می‌شود)
     → REJECTED
     → EDITED + APPROVED
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import Request
from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from app.infrastructure.auditing.logger import audit_logger
from app.models.alert import Alert
from app.models.patient import Patient
from app.models.patient_message import PatientMessage
from app.models.recommendation import Recommendation
from app.models.user import User
from app.shared.enums import AlertStatus, RecommendationStatus, AlertSeverity
from app.exceptions.business_exceptions import (
    RecommendationNotFoundException,
    RecommendationAlreadyReviewedException,
    InvalidStateTransitionException,
)


class RecommendationService:

    # ============================================================
    # CREATE
    # ============================================================

    def create_draft(
        self,
        db: Session,
        patient_id: uuid.UUID,
        alert_id: Optional[uuid.UUID],
        draft_for_clinician: str,
        patient_content: Optional[str] = None,
        education_topic: Optional[str] = None,
        priority: AlertSeverity = AlertSeverity.MEDIUM,
    ) -> Recommendation:
        """
        ایجاد Recommendation Draft برای بررسی پزشک

        Template draft_for_clinician:
        ---
        مشاهدات: {evidence_summary}
        روند: {trend_interpretation}
        ریسک: {risk_level}
        پیشنهاد بررسی: {recommendation_text}
        ---
        """
        rec = Recommendation(
            patient_id=patient_id,
            alert_id=alert_id,
            draft_for_clinician=draft_for_clinician,
            patient_content=patient_content,
            education_topic=education_topic,
            status=RecommendationStatus.DRAFT,
            priority=priority,
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return rec

    def create_draft_from_template(
        self,
        db: Session,
        patient: Patient,
        alert: Alert,
        evidence_summary: str,
        trend_interpretation: str,
        risk_level: str,
        recommendation_text: str,
        patient_message_draft: Optional[str] = None,
        education_topic: Optional[str] = None,
    ) -> Recommendation:
        """
        ایجاد Draft با template استاندارد

        این template برای کلینیسین قابل خواندن و ویرایش است.
        """
        draft_text = (
            f"👤 بیمار: {patient.full_name} "
            f"(کد: {patient.medical_record_number})\n"
            f"📅 تاریخ: {datetime.now(timezone.utc).strftime('%Y-%m-%d')}\n\n"
            f"{'─' * 40}\n\n"
            f"📊 مشاهدات:\n{evidence_summary}\n\n"
            f"📈 روند:\n{trend_interpretation}\n\n"
            f"⚠️ سطح ریسک: {risk_level}\n\n"
            f"✅ پیشنهاد بررسی:\n{recommendation_text}\n\n"
            f"{'─' * 40}\n"
            f"⚡ این پیشنهاد توسط سیستم تولید شده و نیاز به تأیید پزشک دارد."
        )

        return self.create_draft(
            db=db,
            patient_id=patient.id,
            alert_id=alert.id,
            draft_for_clinician=draft_text,
            patient_content=patient_message_draft,
            education_topic=education_topic,
            priority=alert.severity,
        )

    # ============================================================
    # REVIEW ACTIONS
    # ============================================================

    # ============================================================
    # app/services/recommendation_service.py — اصلاح منطق status و مرتب‌سازی
    # ============================================================

    # فقط بخش‌های اصلاح‌شده:

    def approve_recommendation(
        self,
        db: Session,
        recommendation_id: uuid.UUID,
        clinician: User,
        patient_content: Optional[str] = None,
        send_as_message: bool = True,
        request: Optional[Request] = None,
    ) -> Recommendation:
        rec = self._get_rec_or_raise(db, recommendation_id)

        if rec.status == RecommendationStatus.APPROVED:
            return rec

        if rec.status == RecommendationStatus.REJECTED:
            raise RecommendationAlreadyReviewedException(
                f"این توصیه قبلاً رد شده است"
            )

        old_status = rec.status

        # اگر پزشک متن را ویرایش کرد → EDITED، وگرنه → APPROVED
        if patient_content is not None and patient_content.strip() != (rec.patient_content or "").strip():
            rec.patient_content = patient_content
            rec.status = RecommendationStatus.EDITED
        else:
            rec.status = RecommendationStatus.APPROVED

        rec.reviewed_by = clinician.id
        rec.reviewed_at = datetime.now(timezone.utc)

        db.flush()

        message = None
        if send_as_message and rec.patient_content:
            message = self._create_patient_message(db, rec, clinician)

        if rec.alert_id:
            alert = db.query(Alert).filter(Alert.id == rec.alert_id).first()
            if alert and alert.status != AlertStatus.RESOLVED:
                alert.status = AlertStatus.ACKNOWLEDGED
                alert.acknowledged_by = clinician.id
                alert.acknowledged_at = datetime.now(timezone.utc)

        audit_logger.log_approval(
            db=db,
            user_id=clinician.id,
            entity_type="Recommendation",
            entity_id=str(rec.id),
            action="APPROVE",
            old_values={"status": old_status.value},
            new_values={
                "status": rec.status.value,
                "patient_message_created": message is not None,
            },
            request=request,
        )

        db.commit()
        db.refresh(rec)
        return rec


    def get_pending_recommendations(
        self,
        db: Session,
        page: int = 1,
        size: int = 20,
        priority: Optional[AlertSeverity] = None,
    ) -> tuple[list[Recommendation], int]:
        """مرتب‌سازی در DB — نه در Python"""
        from sqlalchemy import case

        priority_case = case(
            (Recommendation.priority == AlertSeverity.HIGH, 0),
            (Recommendation.priority == AlertSeverity.MEDIUM, 1),
            else_=2,
        )

        query = (
            db.query(Recommendation)
            .filter(Recommendation.status == RecommendationStatus.DRAFT)
        )

        if priority:
            query = query.filter(Recommendation.priority == priority)

        total = query.count()
        recs = (
            query
            .order_by(priority_case, Recommendation.created_at.asc())
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )

        return recs, total

    def reject_recommendation(
        self,
        db: Session,
        recommendation_id: uuid.UUID,
        clinician: User,
        reason: str,
        request: Optional[Request] = None,
    ) -> Recommendation:
        """
        رد توصیه توسط پزشک

        توصیه رد‌شده به بیمار ارسال نمی‌شود.
        دلیل رد برای audit و بهبود سیستم ذخیره می‌شود.
        """
        rec = self._get_rec_or_raise(db, recommendation_id)

        if rec.status == RecommendationStatus.REJECTED:
            return rec  # idempotent

        if rec.status == RecommendationStatus.APPROVED:
            raise InvalidStateTransitionException(
                "توصیه تأییدشده را نمی‌توان رد کرد"
            )

        old_status = rec.status
        rec.status = RecommendationStatus.REJECTED
        rec.reviewed_by = clinician.id
        rec.reviewed_at = datetime.now(timezone.utc)
        rec.review_notes = reason

        audit_logger.log_approval(
            db=db,
            user_id=clinician.id,
            entity_type="Recommendation",
            entity_id=str(rec.id),
            action="REJECT",
            old_values={"status": old_status.value},
            new_values={
                "status": RecommendationStatus.REJECTED.value,
                "reason": reason,
            },
            request=request,
        )

        db.commit()
        db.refresh(rec)
        return rec

    # ============================================================
    # READ
    # ============================================================

    def get_patient_recommendations(
        self,
        db: Session,
        patient_id: uuid.UUID,
        status: Optional[RecommendationStatus] = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Recommendation], int]:
        """تاریخچه توصیه‌های یک بیمار"""
        query = db.query(Recommendation).filter(
            Recommendation.patient_id == patient_id
        )

        if status:
            query = query.filter(Recommendation.status == status)

        total = query.count()
        recs = (
            query
            .order_by(desc(Recommendation.created_at))
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )

        return recs, total

    def get_pending_count(self, db: Session) -> int:
        """تعداد توصیه‌های در انتظار — برای badge داشبورد"""
        return db.query(Recommendation).filter(
            Recommendation.status == RecommendationStatus.DRAFT
        ).count()

    # ============================================================
    # HELPER
    # ============================================================

    def _create_patient_message(
        self,
        db: Session,
        recommendation: Recommendation,
        sent_by: User,
    ) -> PatientMessage:
        """ایجاد PatientMessage از Recommendation تأییدشده"""
        from app.services.message_service import message_service
        return message_service.send_message_to_patient(
            db=db,
            patient_id=recommendation.patient_id,
            recommendation_id=recommendation.id,
            content=recommendation.patient_content,
            sent_by=sent_by,
        )

    def _get_rec_or_raise(
        self,
        db: Session,
        recommendation_id: uuid.UUID,
    ) -> Recommendation:
        rec = db.query(Recommendation).filter(
            Recommendation.id == recommendation_id
        ).first()
        if not rec:
            raise RecommendationNotFoundException(
                f"توصیه با شناسه {recommendation_id} یافت نشد"
            )
        return rec


# Singleton
recommendation_service = RecommendationService()