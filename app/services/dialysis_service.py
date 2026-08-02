"""
سرویس جلسات دیالیز

پردازش کامل داده‌های هر جلسه همودیالیز با محاسبات پزشکی دقیق
"""

import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import Request
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.infrastructure.auditing.logger import audit_logger
from app.models.dialysis_session import DialysisSession
from app.models.patient import Patient
from app.models.user import User
from app.schemas.dialysis_session import (
    DialysisSessionCreateRequest,
    DialysisSessionUpdateRequest,
)
from app.shared.enums import SessionEvent
from app.shared.utils import calculate_idwg, calculate_uf_volume, calculate_bp_drop
from app.validators.dialysis_validator import (
    validate_session_weights,
    validate_session_duration,
)
from app.validators.bp_validator import validate_session_bp
from app.exceptions.business_exceptions import (
    DuplicateSessionException,
    PatientNotFoundException,
)
from app.config.thresholds import WEIGHT_THRESHOLDS


class DialysisService:

    # ============================================================
    # CREATE
    # ============================================================
    def create_session(
        self,
        db: Session,
        patient_id: uuid.UUID,
        data: DialysisSessionCreateRequest,
        recorded_by: User,
        request: Optional[Request] = None,
    ) -> DialysisSession:
        """
        ثبت جلسه دیالیز جدید

        مراحل:
        1. بررسی تکراری نبودن (یک جلسه در روز)
        2. اعتبارسنجی وزن‌ها (با محاسبه IDWG)
        3. اعتبارسنجی BP
        4. محاسبه خودکار: weight_gain, uf_volume, bp_drop
        5. ذخیره snapshot وزن خشک
        6. Trigger تحلیل async
        """
        # دریافت بیمار
        patient = db.query(Patient).filter(
            Patient.id == patient_id,
            Patient.is_active == True,
        ).first()

        if not patient:
            raise PatientNotFoundException(
                f"بیمار با شناسه {patient_id} یافت نشد"
            )

        # بررسی تکراری بودن
        existing = db.query(DialysisSession).filter(
            DialysisSession.patient_id == patient_id,
            DialysisSession.session_date == data.session_date,
        ).first()

        if existing:
            raise DuplicateSessionException(
                f"یک جلسه دیالیز برای بیمار {patient.full_name} "
                f"در تاریخ {data.session_date} از قبل ثبت شده است"
            )

        # ============================================================
        # اعتبارسنجی وزن‌ها
        # ============================================================
        weight_validation = validate_session_weights(
            pre_weight=data.pre_weight,
            dry_weight=patient.dry_weight,
            post_weight=data.post_weight,
            duration_minutes=data.duration_minutes,
        )

        if not weight_validation.is_valid:
            from app.exceptions.business_exceptions import InvalidWeightException
            raise InvalidWeightException(
                message="; ".join(weight_validation.errors),
                details={"errors": weight_validation.errors},
            )

        # ============================================================
        # اعتبارسنجی فشار خون
        # ============================================================
        bp_validation = validate_session_bp(
            bp_pre_systolic=data.bp_pre_systolic,
            bp_pre_diastolic=data.bp_pre_diastolic,
            bp_during_systolic=data.bp_during_systolic,
            bp_during_diastolic=data.bp_during_diastolic,
            bp_post_systolic=data.bp_post_systolic,
            bp_post_diastolic=data.bp_post_diastolic,
        )

        if not bp_validation.is_valid:
            from app.exceptions.business_exceptions import InvalidBPException
            raise InvalidBPException(
                message="; ".join(bp_validation.errors),
                details={"errors": bp_validation.errors},
            )

        # ============================================================
        # محاسبات خودکار
        # ============================================================
        idwg_kg = weight_validation.idwg_kg
        idwg_percent = weight_validation.idwg_percent
        uf_volume = weight_validation.uf_volume

        # محاسبه افت BP حین دیالیز
        bp_drop = calculate_bp_drop(
            data.bp_pre_systolic,
            data.bp_during_systolic,
        )

        # بررسی IDH خودکار
        events = list(data.intradialytic_events or [])
        if bp_drop is not None and bp_drop >= 20:
            if SessionEvent.HYPOTENSION.value not in events:
                events.append(SessionEvent.HYPOTENSION.value)

        # محاسبه مدت از زمان شروع/پایان (اگر وارد شده)
        duration = data.duration_minutes
        if (
            duration is None
            and data.session_start_time
            and data.session_end_time
        ):
            start_dt = datetime.combine(data.session_date, data.session_start_time)
            end_dt = datetime.combine(data.session_date, data.session_end_time)
            if end_dt > start_dt:
                duration = int((end_dt - start_dt).total_seconds() / 60)

        # ============================================================
        # ایجاد رکورد
        # ============================================================
        session = DialysisSession(
            patient_id=patient_id,
            session_date=data.session_date,
            session_start_time=data.session_start_time,
            session_end_time=data.session_end_time,
            duration_minutes=duration,
            pre_weight=data.pre_weight,
            post_weight=data.post_weight,
            dry_weight_at_session=patient.dry_weight,
            weight_gain=idwg_kg,
            weight_gain_percent=idwg_percent,
            uf_volume=uf_volume,
            bp_pre_systolic=data.bp_pre_systolic,
            bp_pre_diastolic=data.bp_pre_diastolic,
            bp_during_systolic=data.bp_during_systolic,
            bp_during_diastolic=data.bp_during_diastolic,
            bp_post_systolic=data.bp_post_systolic,
            bp_post_diastolic=data.bp_post_diastolic,
            bp_drop_during=bp_drop,
            intradialytic_events=events if events else None,
            notes=data.notes,
            recorded_by=recorded_by.id,
        )

        db.add(session)
        db.flush()

        audit_logger.log_create(
            db=db,
            user_id=recorded_by.id,
            entity_type="DialysisSession",
            entity_id=str(session.id),
            new_values={
                "patient_id": str(patient_id),
                "session_date": str(data.session_date),
                "pre_weight": data.pre_weight,
                "idwg_kg": idwg_kg,
                "idwg_percent": idwg_percent,
            },
            request=request,
        )

        db.commit()
        db.refresh(session)

        # Trigger تحلیل async
        self._trigger_analysis(session.id, patient_id)

        return session

    def _trigger_analysis(
        self,
        session_id: uuid.UUID,
        patient_id: uuid.UUID,
    ) -> None:
        """Trigger کردن تحلیل async — در تسک‌های بعد پیاده‌سازی می‌شود"""
        try:
            from app.tasks.analysis_tasks import analyze_session
            analyze_session.delay(str(session_id))
        except Exception:
            pass  # اگر Celery در دسترس نبود، silently fail

    # ============================================================
    # READ
    # ============================================================
    def get_sessions(
        self,
        db: Session,
        patient_id: uuid.UUID,
        page: int = 1,
        size: int = 20,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
    ) -> tuple[list[DialysisSession], int]:
        """لیست جلسات با pagination و فیلتر تاریخ"""
        query = db.query(DialysisSession).filter(
            DialysisSession.patient_id == patient_id
        )

        if from_date:
            query = query.filter(DialysisSession.session_date >= from_date)
        if to_date:
            query = query.filter(DialysisSession.session_date <= to_date)

        total = query.count()
        sessions = (
            query
            .order_by(desc(DialysisSession.session_date))
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )

        return sessions, total

    def get_session_by_id(
        self,
        db: Session,
        session_id: uuid.UUID,
        patient_id: uuid.UUID,
    ) -> DialysisSession:
        """دریافت جلسه با ID"""
        session = db.query(DialysisSession).filter(
            DialysisSession.id == session_id,
            DialysisSession.patient_id == patient_id,
        ).first()

        if not session:
            raise ValueError(f"جلسه دیالیز یافت نشد")

        return session

    def get_weight_trend(
        self,
        db: Session,
        patient_id: uuid.UUID,
        n_sessions: int = 8,
    ) -> dict:
        """
        روند وزن در n جلسه اخیر

        خروجی برای رسم نمودار در اپ بیمار
        """
        sessions = (
            db.query(DialysisSession)
            .filter(DialysisSession.patient_id == patient_id)
            .order_by(desc(DialysisSession.session_date))
            .limit(n_sessions)
            .all()
        )

        sessions = list(reversed(sessions))  # مرتب از قدیم به جدید

        if not sessions:
            return {
                "sessions": [],
                "trend": None,
                "avg_idwg_percent": None,
                "max_idwg_percent": None,
            }

        idwg_values = [
            s.weight_gain_percent
            for s in sessions
            if s.weight_gain_percent is not None
        ]

        from app.shared.utils import classify_trend_direction
        trend = None
        if len(idwg_values) >= 3:
            trend = classify_trend_direction(idwg_values)

        return {
            "sessions": [
                {
                    "date": str(s.session_date),
                    "pre_weight": s.pre_weight,
                    "post_weight": s.post_weight,
                    "dry_weight": s.dry_weight_at_session,
                    "weight_gain": s.weight_gain,
                    "weight_gain_percent": s.weight_gain_percent,
                    "uf_volume": s.uf_volume,
                }
                for s in sessions
            ],
            "trend": trend.value if trend else None,
            "avg_idwg_percent": (
                round(sum(idwg_values) / len(idwg_values), 2)
                if idwg_values else None
            ),
            "max_idwg_percent": max(idwg_values) if idwg_values else None,
        }

    def get_bp_trend(
        self,
        db: Session,
        patient_id: uuid.UUID,
        n_sessions: int = 8,
    ) -> dict:
        """
        روند فشار خون در n جلسه اخیر

        IDH را هم در خروجی می‌آورد
        """
        sessions = (
            db.query(DialysisSession)
            .filter(DialysisSession.patient_id == patient_id)
            .order_by(desc(DialysisSession.session_date))
            .limit(n_sessions)
            .all()
        )

        sessions = list(reversed(sessions))

        pre_systolics = [
            s.bp_pre_systolic
            for s in sessions
            if s.bp_pre_systolic is not None
        ]

        from app.shared.utils import classify_trend_direction
        bp_trend = None
        if len(pre_systolics) >= 3:
            bp_trend = classify_trend_direction(
                [float(v) for v in pre_systolics]
            )

        idh_count = sum(
            1 for s in sessions
            if s.had_intradialytic_hypotension
        )

        return {
            "sessions": [
                {
                    "date": str(s.session_date),
                    "bp_pre": (
                        f"{s.bp_pre_systolic}/{s.bp_pre_diastolic}"
                        if s.has_bp_pre else None
                    ),
                    "bp_pre_systolic": s.bp_pre_systolic,
                    "bp_pre_diastolic": s.bp_pre_diastolic,
                    "bp_during_systolic": s.bp_during_systolic,
                    "bp_during_diastolic": s.bp_during_diastolic,
                    "bp_post_systolic": s.bp_post_systolic,
                    "bp_post_diastolic": s.bp_post_diastolic,
                    "bp_drop_during": s.bp_drop_during,
                    "had_idh": s.had_intradialytic_hypotension,
                }
                for s in sessions
            ],
            "bp_trend": bp_trend.value if bp_trend else None,
            "idh_count": idh_count,
            "idh_rate_percent": (
                round(idh_count / len(sessions) * 100, 1)
                if sessions else None
            ),
        }

    def get_consecutive_high_idwg_count(
        self,
        db: Session,
        patient_id: uuid.UUID,
        threshold_percent: float,
        n_sessions: int = 4,
    ) -> int:
        """
        تعداد جلسات متوالی با IDWG بالا

        برای Rule Engine استفاده می‌شود
        """
        sessions = (
            db.query(DialysisSession)
            .filter(DialysisSession.patient_id == patient_id)
            .order_by(desc(DialysisSession.session_date))
            .limit(n_sessions)
            .all()
        )

        count = 0
        for session in sessions:
            if (
                session.weight_gain_percent is not None
                and session.weight_gain_percent >= threshold_percent
            ):
                count += 1
            else:
                break  # اولین جلسه‌ای که زیر threshold بود

        return count

    # ============================================================
    # UPDATE
    # ============================================================
    def update_session(
        self,
        db: Session,
        session_id: uuid.UUID,
        patient_id: uuid.UUID,
        data: DialysisSessionUpdateRequest,
        updated_by: User,
        request: Optional[Request] = None,
    ) -> DialysisSession:
        """
        ویرایش جلسه دیالیز

        محدودیت: فقط جلسات ۴۸ ساعت گذشته قابل ویرایش هستند
        """
        session = self.get_session_by_id(db, session_id, patient_id)

        # بررسی محدودیت زمانی
        session_datetime = datetime.combine(
            session.session_date,
            datetime.min.time(),
        ).replace(tzinfo=timezone.utc)

        time_limit = datetime.now(timezone.utc) - timedelta(hours=48)
        if session_datetime < time_limit:
            raise ValueError(
                "فقط جلسات ۴۸ ساعت گذشته قابل ویرایش هستند"
            )

        old_values = {
            "post_weight": session.post_weight,
            "bp_post_systolic": session.bp_post_systolic,
            "bp_post_diastolic": session.bp_post_diastolic,
            "notes": session.notes,
        }

        update_data = data.model_dump(exclude_unset=True)

        # اگر post_weight تغییر کرد، UF را دوباره محاسبه کن
        if "post_weight" in update_data and update_data["post_weight"] is not None:
            new_post = update_data["post_weight"]
            if new_post > session.pre_weight:
                from app.exceptions.business_exceptions import InvalidWeightException
                raise InvalidWeightException(
                    message="وزن بعد از دیالیز نمی‌تواند بیشتر از وزن قبل باشد",
                    details={"post_weight": new_post, "pre_weight": session.pre_weight},
                )
            update_data["uf_volume"] = round(session.pre_weight - new_post, 2)

        # اگر BP during تغییر کرد، bp_drop را دوباره محاسبه کن
        if "bp_during_systolic" in update_data:
            new_drop = calculate_bp_drop(
                session.bp_pre_systolic,
                update_data["bp_during_systolic"],
            )
            update_data["bp_drop_during"] = new_drop

            # بررسی IDH
            events = list(session.intradialytic_events or [])
            if new_drop is not None and new_drop >= 20:
                if SessionEvent.HYPOTENSION.value not in events:
                    events.append(SessionEvent.HYPOTENSION.value)
                update_data["intradialytic_events"] = events

        for field, value in update_data.items():
            setattr(session, field, value)

        audit_logger.log_update(
            db=db,
            user_id=updated_by.id,
            entity_type="DialysisSession",
            entity_id=str(session.id),
            old_values=old_values,
            new_values=update_data,
            request=request,
        )

        db.commit()
        db.refresh(session)

        # Re-trigger تحلیل
        self._trigger_analysis(session.id, patient_id)

        return session


# Singleton
dialysis_service = DialysisService()