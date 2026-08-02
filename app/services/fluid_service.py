"""
سرویس ثبت مایعات

پایش مصرف مایعات روزانه بیماران دیالیزی
"""

import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import Request
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.infrastructure.auditing.logger import audit_logger
from app.models.fluid_log import FluidLog
from app.models.patient import Patient
from app.models.user import User
from app.schemas.fluid_log import FluidLogCreateRequest
from app.shared.constants import FLUID_THRESHOLDS
from app.exceptions.business_exceptions import PatientNotFoundException


class FluidService:

    def log_fluid_intake(
        self,
        db: Session,
        patient_id: uuid.UUID,
        data: FluidLogCreateRequest,
        logged_by: User,
        request: Optional[Request] = None,
    ) -> FluidLog:
        """
        ثبت یا به‌روزرسانی مصرف مایعات روزانه (upsert)

        اگر برای همان روز قبلاً ثبت شده، به‌روزرسانی می‌کند.
        """
        patient = db.query(Patient).filter(
            Patient.id == patient_id,
            Patient.is_active == True,
        ).first()

        if not patient:
            raise PatientNotFoundException(
                f"بیمار با شناسه {patient_id} یافت نشد"
            )

        # محاسبه total واقعی
        total_ml = data.get_effective_total()
        if total_ml is None:
            raise ValueError(
                "باید یا total_ml یا لیست آیتم‌های مایعات وارد شود"
            )

        items_data = None
        if data.items:
            items_data = [
                {"type": item.fluid_type, "amount_ml": item.amount_ml}
                for item in data.items
            ]

        # upsert — اگر همان روز وجود داشت
        existing = db.query(FluidLog).filter(
            FluidLog.patient_id == patient_id,
            FluidLog.log_date == data.log_date,
        ).first()

        if existing:
            old_total = existing.total_ml
            existing.total_ml = total_ml
            existing.items = items_data
            existing.notes = data.notes

            audit_logger.log_update(
                db=db,
                user_id=logged_by.id,
                entity_type="FluidLog",
                entity_id=str(existing.id),
                old_values={"total_ml": old_total},
                new_values={"total_ml": total_ml},
                request=request,
            )

            db.commit()
            db.refresh(existing)
            log = existing
        else:
            log = FluidLog(
                patient_id=patient_id,
                log_date=data.log_date,
                total_ml=total_ml,
                items=items_data,
                notes=data.notes,
                logged_by=logged_by.id,
            )
            db.add(log)
            db.flush()

            audit_logger.log_create(
                db=db,
                user_id=logged_by.id,
                entity_type="FluidLog",
                entity_id=str(log.id),
                new_values={
                    "patient_id": str(patient_id),
                    "date": str(data.log_date),
                    "total_ml": total_ml,
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
            from app.tasks.analysis_tasks import analyze_fluid
            analyze_fluid.delay(str(log_id))
        except Exception:
            pass

    def get_fluid_history(
        self,
        db: Session,
        patient_id: uuid.UUID,
        days: int = 30,
        page: int = 1,
        size: int = 30,
    ) -> tuple[list[FluidLog], int]:
        """تاریخچه مصرف مایعات"""
        query = db.query(FluidLog).filter(
            FluidLog.patient_id == patient_id
        )

        if days:
            cutoff = date.today() - timedelta(days=days)
            query = query.filter(FluidLog.log_date >= cutoff)

        total = query.count()
        logs = (
            query
            .order_by(desc(FluidLog.log_date))
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )

        return logs, total

    def get_avg_fluid_last_n_days(
        self,
        db: Session,
        patient_id: uuid.UUID,
        days: int = 7,
    ) -> Optional[float]:
        """
        میانگین مصرف مایعات n روز اخیر

        برای Rule Engine و داشبورد
        """
        cutoff = date.today() - timedelta(days=days)
        logs = (
            db.query(FluidLog)
            .filter(
                FluidLog.patient_id == patient_id,
                FluidLog.log_date >= cutoff,
            )
            .all()
        )

        if not logs:
            return None

        return round(sum(log.total_ml for log in logs) / len(logs), 1)

    def get_high_fluid_streak(
        self,
        db: Session,
        patient_id: uuid.UUID,
        threshold_ml: int,
        n_days: int = 3,
    ) -> int:
        """
        تعداد روزهای متوالی اخیر با مصرف بالا

        برای Rule Engine: تشخیص الگوی احتباس مایعات
        """
        logs = (
            db.query(FluidLog)
            .filter(FluidLog.patient_id == patient_id)
            .order_by(desc(FluidLog.log_date))
            .limit(n_days)
            .all()
        )

        count = 0
        for log in logs:
            if log.total_ml >= threshold_ml:
                count += 1
            else:
                break

        return count


# Singleton
fluid_service = FluidService()