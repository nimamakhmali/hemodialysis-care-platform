"""
سرویس گزارش علائم بیمار

مدیریت علائم خودگزارشی بیماران دیالیزی
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Request
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.infrastructure.auditing.logger import audit_logger
from app.models.alert import Alert
from app.models.dialysis_session import DialysisSession
from app.models.patient import Patient
from app.models.symptom_report import SymptomReport
from app.models.user import User
from app.schemas.symptom_report import SymptomReportCreateRequest
from app.shared.enums import (
    AlertCategory,
    AlertSeverity,
    AlertStatus,
    SymptomSeverity,
    SymptomType,
)
from app.exceptions.business_exceptions import PatientNotFoundException

# علائم خطر فوری که نیاز به Alert HIGH دارند
DANGER_SYMPTOMS = {
    SymptomType.CHEST_PAIN,
    SymptomType.SHORTNESS_OF_BREATH,
}

# علائم نیمه‌فوری (MEDIUM alert اگر SEVERE باشند)
CONCERNING_SYMPTOMS = {
    SymptomType.DIZZINESS,
    SymptomType.SWELLING,
    SymptomType.ACCESS_SITE_PAIN,
}


class SymptomService:

    # ============================================================
    # CREATE
    # ============================================================
    def create_symptom_report(
        self,
        db: Session,
        patient_id: uuid.UUID,
        data: SymptomReportCreateRequest,
        reported_by: User,
        request: Optional[Request] = None,
    ) -> SymptomReport:
        """
        ثبت گزارش علائم بیمار

        مراحل:
        1. بررسی بیمار
        2. تشخیص علائم خطر
        3. ذخیره گزارش
        4. ایجاد فوری Alert برای علائم خطر (بدون انتظار برای Celery)
        5. Trigger تحلیل async برای بقیه
        """
        patient = db.query(Patient).filter(
            Patient.id == patient_id,
            Patient.is_active == True,
        ).first()

        if not patient:
            raise PatientNotFoundException(
                f"بیمار با شناسه {patient_id} یافت نشد"
            )

        # ============================================================
        # تشخیص علائم خطر
        # ============================================================
        symptoms_data = [
            {
                "type": s.symptom_type.value,
                "severity": s.severity.value,
            }
            for s in data.symptoms
        ]

        danger_found = []
        for s in data.symptoms:
            if s.symptom_type in DANGER_SYMPTOMS:
                danger_found.append(s.symptom_type)
            elif (
                s.symptom_type in CONCERNING_SYMPTOMS
                and s.severity == SymptomSeverity.SEVERE
            ):
                danger_found.append(s.symptom_type)

        reported_at = data.reported_at or datetime.now(timezone.utc)

        # ============================================================
        # ایجاد گزارش
        # ============================================================
        report = SymptomReport(
            patient_id=patient_id,
            reported_at=reported_at,
            symptoms=symptoms_data,
            notes=data.notes,
            related_session_id=data.related_session_id,
            has_danger_symptoms=len(danger_found) > 0,
            reported_by=reported_by.id,
        )

        db.add(report)
        db.flush()

        audit_logger.log_create(
            db=db,
            user_id=reported_by.id,
            entity_type="SymptomReport",
            entity_id=str(report.id),
            new_values={
                "patient_id": str(patient_id),
                "symptom_count": len(data.symptoms),
                "has_danger": len(danger_found) > 0,
                "danger_symptoms": [s.value for s in danger_found],
            },
            request=request,
        )

        # ============================================================
        # Alert فوری برای علائم خطر — بدون Celery (همزمان)
        # ============================================================
        if danger_found:
            self._create_immediate_danger_alert(
                db=db,
                patient=patient,
                report=report,
                danger_symptoms=danger_found,
                reported_by=reported_by,
            )

        db.commit()
        db.refresh(report)

        # Trigger تحلیل async (برای الگوهای تکرار و cross-domain)
        self._trigger_analysis(report.id, patient_id)

        return report

    def _create_immediate_danger_alert(
        self,
        db: Session,
        patient: Patient,
        report: SymptomReport,
        danger_symptoms: list[SymptomType],
        reported_by: User,
    ) -> Alert:
        """
        ایجاد فوری Alert HIGH برای علائم خطر

        این alert بلافاصله (بدون Celery) ایجاد می‌شود
        چون علائم قلبی/تنفسی شدید نیاز به واکنش فوری دارند.
        """
        symptom_names_fa = {
            SymptomType.CHEST_PAIN: "درد قفسه سینه",
            SymptomType.SHORTNESS_OF_BREATH: "تنگی نفس",
            SymptomType.DIZZINESS: "سرگیجه شدید",
            SymptomType.SWELLING: "ادم شدید",
            SymptomType.ACCESS_SITE_PAIN: "درد شدید محل دسترسی عروقی",
        }

        danger_names = [
            symptom_names_fa.get(s, s.value)
            for s in danger_symptoms
        ]

        # بررسی duplicate: آیا در ۲ ساعت گذشته همین هشدار ایجاد شده؟
        two_hours_ago = datetime.now(timezone.utc) - timedelta(hours=2)
        existing = db.query(Alert).filter(
            Alert.patient_id == patient.id,
            Alert.triggered_by_rule == "DANGER_SYMPTOM_IMMEDIATE",
            Alert.status == AlertStatus.NEW,
            Alert.created_at >= two_hours_ago,
        ).first()

        if existing:
            return existing

        alert = Alert(
            patient_id=patient.id,
            severity=AlertSeverity.HIGH,
            category=AlertCategory.SYMPTOM,
            title=f"علائم خطر: {', '.join(danger_names)}",
            clinician_explanation=(
                f"بیمار {patient.full_name} علائم خطر گزارش کرده است: "
                f"{', '.join(danger_names)}. "
                f"بررسی فوری توسط تیم درمان ضروری است. "
                f"در صورت نیاز، ارسال به اورژانس در نظر گرفته شود."
            ),
            evidence={
                "report_id": str(report.id),
                "danger_symptoms": [s.value for s in danger_symptoms],
                "all_symptoms": report.symptoms,
                "reported_at": report.reported_at.isoformat(),
            },
            triggered_by_rule="DANGER_SYMPTOM_IMMEDIATE",
            status=AlertStatus.NEW,
        )

        db.add(alert)
        db.flush()
        return alert

    def _trigger_analysis(
        self,
        report_id: uuid.UUID,
        patient_id: uuid.UUID,
    ) -> None:
        """Trigger تحلیل async"""
        try:
            from app.tasks.analysis_tasks import analyze_symptoms
            analyze_symptoms.delay(str(report_id))
        except Exception:
            pass

    # ============================================================
    # READ
    # ============================================================
    def get_symptom_history(
        self,
        db: Session,
        patient_id: uuid.UUID,
        page: int = 1,
        size: int = 20,
        days: Optional[int] = None,
    ) -> tuple[list[SymptomReport], int]:
        """تاریخچه گزارش‌های علائم"""
        query = db.query(SymptomReport).filter(
            SymptomReport.patient_id == patient_id
        )

        if days:
            cutoff = datetime.now(timezone.utc) - timedelta(days=days)
            query = query.filter(SymptomReport.reported_at >= cutoff)

        total = query.count()
        reports = (
            query
            .order_by(desc(SymptomReport.reported_at))
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )

        return reports, total

    def get_symptom_frequency(
        self,
        db: Session,
        patient_id: uuid.UUID,
        days: int = 90,
    ) -> dict:
        """
        خلاصه فرکانس علائم در بازه زمانی

        برای:
        - نمایش در داشبورد کلینیسین
        - تحلیل روند توسط Rule Engine
        - تشخیص علائم تکرارشونده
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        reports = (
            db.query(SymptomReport)
            .filter(
                SymptomReport.patient_id == patient_id,
                SymptomReport.reported_at >= cutoff,
            )
            .all()
        )

        symptom_counts: dict[str, dict] = {}
        danger_count = 0

        for report in reports:
            if report.has_danger_symptoms:
                danger_count += 1

            for symptom in (report.symptoms or []):
                stype = symptom.get("type", "")
                severity = symptom.get("severity", "")

                if stype not in symptom_counts:
                    symptom_counts[stype] = {
                        "total": 0,
                        "mild": 0,
                        "moderate": 0,
                        "severe": 0,
                    }

                symptom_counts[stype]["total"] += 1
                if severity in symptom_counts[stype]:
                    symptom_counts[stype][severity] += 1

        most_frequent = None
        if symptom_counts:
            most_frequent = max(
                symptom_counts,
                key=lambda k: symptom_counts[k]["total"],
            )

        return {
            "period_days": days,
            "total_reports": len(reports),
            "symptom_counts": symptom_counts,
            "most_frequent": most_frequent,
            "danger_symptom_occurrences": danger_count,
        }

    def get_recent_symptom_count(
        self,
        db: Session,
        patient_id: uuid.UUID,
        symptom_type: SymptomType,
        days: int = 7,
    ) -> int:
        """
        تعداد تکرار یک علامت خاص در بازه اخیر

        برای Rule Engine: تشخیص علائم تکرارشونده
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        reports = (
            db.query(SymptomReport)
            .filter(
                SymptomReport.patient_id == patient_id,
                SymptomReport.reported_at >= cutoff,
            )
            .all()
        )

        count = 0
        for report in reports:
            for symptom in (report.symptoms or []):
                if symptom.get("type") == symptom_type.value:
                    count += 1
                    break  # یک بار در هر report

        return count


# Singleton
symptom_service = SymptomService()