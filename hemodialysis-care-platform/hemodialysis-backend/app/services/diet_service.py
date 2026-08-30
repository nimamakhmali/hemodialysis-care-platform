"""
سرویس ثبت رژیم غذایی

پایش رعایت محدودیت‌های غذایی بیماران دیالیزی
"""

import uuid
from datetime import date, timedelta
from typing import Optional

from fastapi import Request
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.infrastructure.auditing.logger import audit_logger
from app.models.diet_log import DietLog
from app.models.patient import Patient
from app.models.user import User
from app.schemas.diet_log import DietLogCreateRequest
from app.shared.enums import DietAdherence
from app.exceptions.business_exceptions import PatientNotFoundException


class DietService:

    def log_diet(
        self,
        db: Session,
        patient_id: uuid.UUID,
        data: DietLogCreateRequest,
        logged_by: User,
        request: Optional[Request] = None,
    ) -> DietLog:
        """
        ثبت یا به‌روزرسانی رژیم غذایی روزانه (upsert)
        """
        patient = db.query(Patient).filter(
            Patient.id == patient_id,
            Patient.is_active == True,
        ).first()

        if not patient:
            raise PatientNotFoundException(
                f"بیمار با شناسه {patient_id} یافت نشد"
            )

        existing = db.query(DietLog).filter(
            DietLog.patient_id == patient_id,
            DietLog.log_date == data.log_date,
        ).first()

        if existing:
            old_values = {
                "potassium_adherence": existing.potassium_adherence.value,
                "phosphorus_adherence": existing.phosphorus_adherence.value,
            }

            existing.potassium_adherence = data.potassium_adherence
            existing.phosphorus_adherence = data.phosphorus_adherence
            existing.protein_adherence = data.protein_adherence
            existing.sodium_adherence = data.sodium_adherence
            existing.fluid_binder_taken = data.fluid_binder_taken
            existing.notes = data.notes

            audit_logger.log_update(
                db=db,
                user_id=logged_by.id,
                entity_type="DietLog",
                entity_id=str(existing.id),
                old_values=old_values,
                new_values={
                    "potassium_adherence": data.potassium_adherence.value,
                    "phosphorus_adherence": data.phosphorus_adherence.value,
                },
                request=request,
            )

            db.commit()
            db.refresh(existing)
            log = existing
        else:
            log = DietLog(
                patient_id=patient_id,
                log_date=data.log_date,
                potassium_adherence=data.potassium_adherence,
                phosphorus_adherence=data.phosphorus_adherence,
                protein_adherence=data.protein_adherence,
                sodium_adherence=data.sodium_adherence,
                fluid_binder_taken=data.fluid_binder_taken,
                notes=data.notes,
                logged_by=logged_by.id,
            )
            db.add(log)
            db.flush()

            audit_logger.log_create(
                db=db,
                user_id=logged_by.id,
                entity_type="DietLog",
                entity_id=str(log.id),
                new_values={
                    "patient_id": str(patient_id),
                    "date": str(data.log_date),
                    "potassium": data.potassium_adherence.value,
                    "phosphorus": data.phosphorus_adherence.value,
                },
                request=request,
            )

            db.commit()
            db.refresh(log)

        # Trigger تحلیل
        self._trigger_analysis(log.id, patient_id)

        return log

    def _trigger_analysis(
        self,
        log_id: uuid.UUID,
        patient_id: uuid.UUID,
    ) -> None:
        try:
            from app.tasks.analysis_tasks import analyze_diet
            analyze_diet.delay(str(log_id))
        except Exception:
            pass

    def get_diet_history(
        self,
        db: Session,
        patient_id: uuid.UUID,
        days: int = 30,
        page: int = 1,
        size: int = 30,
    ) -> tuple[list[DietLog], int]:
        """تاریخچه رژیم غذایی"""
        query = db.query(DietLog).filter(
            DietLog.patient_id == patient_id
        )

        if days:
            cutoff = date.today() - timedelta(days=days)
            query = query.filter(DietLog.log_date >= cutoff)

        total = query.count()
        logs = (
            query
            .order_by(desc(DietLog.log_date))
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )

        return logs, total

    def get_adherence_summary(
        self,
        db: Session,
        patient_id: uuid.UUID,
        days: int = 30,
    ) -> dict:
        """
        خلاصه رعایت رژیم در بازه زمانی

        برای Rule Engine و داشبورد
        """
        cutoff = date.today() - timedelta(days=days)
        logs = (
            db.query(DietLog)
            .filter(
                DietLog.patient_id == patient_id,
                DietLog.log_date >= cutoff,
            )
            .all()
        )

        if not logs:
            return {
                "period_days": days,
                "total_logs": 0,
                "potassium_poor_rate": 0.0,
                "phosphorus_poor_rate": 0.0,
                "protein_poor_rate": 0.0,
                "sodium_poor_rate": 0.0,
                "binder_missed_rate": 0.0,
                "poor_adherence_streak": 0,
                "overall_score": 100.0,
            }

        def poor_rate(field: str) -> float:
            poor = sum(
                1 for log in logs
                if getattr(log, field) == DietAdherence.POOR
            )
            return round(poor / len(logs) * 100, 1)

        def good_rate(field: str) -> float:
            good = sum(
                1 for log in logs
                if getattr(log, field) in (
                    DietAdherence.GOOD, DietAdherence.MODERATE
                )
            )
            return round(good / len(logs) * 100, 1)

        # streak روزهای متوالی poor (همه محدودیت‌ها)
        sorted_logs = sorted(logs, key=lambda x: x.log_date, reverse=True)
        streak = 0
        for log in sorted_logs:
            if all(
                getattr(log, field) == DietAdherence.POOR
                for field in [
                    "potassium_adherence",
                    "phosphorus_adherence",
                ]
            ):
                streak += 1
            else:
                break

        # binder miss rate
        binder_logs = [log for log in logs if log.fluid_binder_taken is not None]
        binder_missed_rate = 0.0
        if binder_logs:
            missed = sum(1 for log in binder_logs if not log.fluid_binder_taken)
            binder_missed_rate = round(missed / len(binder_logs) * 100, 1)

        # امتیاز کلی
        overall = round(
            (
                good_rate("potassium_adherence") +
                good_rate("phosphorus_adherence") +
                good_rate("protein_adherence") +
                good_rate("sodium_adherence")
            ) / 4,
            1,
        )

        return {
            "period_days": days,
            "total_logs": len(logs),
            "potassium_poor_rate": poor_rate("potassium_adherence"),
            "phosphorus_poor_rate": poor_rate("phosphorus_adherence"),
            "protein_poor_rate": poor_rate("protein_adherence"),
            "sodium_poor_rate": poor_rate("sodium_adherence"),
            "binder_missed_rate": binder_missed_rate,
            "poor_adherence_streak": streak,
            "overall_score": overall,
        }

    def get_poor_adherence_streak(
        self,
        db: Session,
        patient_id: uuid.UUID,
        field: str,
        n_days: int = 7,
    ) -> int:
        """
        تعداد روزهای متوالی اخیر با رعایت POOR برای یک محدودیت خاص

        برای Rule Engine
        """
        logs = (
            db.query(DietLog)
            .filter(DietLog.patient_id == patient_id)
            .order_by(desc(DietLog.log_date))
            .limit(n_days)
            .all()
        )

        count = 0
        for log in logs:
            if getattr(log, field) == DietAdherence.POOR:
                count += 1
            else:
                break

        return count


# Singleton
diet_service = DietService()