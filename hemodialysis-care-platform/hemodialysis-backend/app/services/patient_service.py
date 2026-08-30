"""
سرویس مدیریت بیماران

تمام عملیات CRUD و business logic مربوط به بیمار
"""

import uuid
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import Request
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.infrastructure.auditing.logger import audit_logger
from app.models.alert import Alert
from app.models.dialysis_session import DialysisSession
from app.models.lab_result import LabPanel
from app.models.patient import Patient
from app.models.recommendation import Recommendation
from app.models.user import User
from app.schemas.patient import PatientCreateRequest, PatientUpdateRequest
from app.shared.enums import AlertSeverity, AlertStatus, RecommendationStatus, UserRole
from app.exceptions.business_exceptions import (
    DuplicateMedicalRecordException,
    PatientNotFoundException,
)
from app.validators.patient_validator import (
    validate_dry_weight,
    validate_phone_number,
)
from app.config.thresholds import WEIGHT_THRESHOLDS


class PatientService:

    # ============================================================
    # CREATE
    # ============================================================
    def create_patient(
        self,
        db: Session,
        data: PatientCreateRequest,
        created_by: User,
        request: Optional[Request] = None,
    ) -> Patient:
        """
        ایجاد بیمار جدید

        - بررسی تکراری بودن کد بیمارستانی
        - اعتبارسنجی وزن خشک
        - ثبت audit log
        """
        # بررسی تکراری بودن MRN
        existing = db.query(Patient).filter(
            Patient.medical_record_number == data.medical_record_number
        ).first()

        if existing:
            raise DuplicateMedicalRecordException(
                f"بیمار با کد بیمارستانی '{data.medical_record_number}' "
                f"از قبل در سیستم ثبت شده است"
            )

        # اعتبارسنجی وزن خشک
        is_valid, errors = validate_dry_weight(data.dry_weight)
        if not is_valid:
            from app.exceptions.business_exceptions import InvalidWeightException
            raise InvalidWeightException(
                message="; ".join(errors),
                details={"dry_weight": data.dry_weight, "errors": errors},
            )

        # نرمال‌سازی شماره تلفن
        phone = None
        if data.phone_number:
            is_valid_phone, result = validate_phone_number(data.phone_number)
            if not is_valid_phone:
                from app.exceptions.business_exceptions import InvalidWeightException
                raise ValueError(result)
            phone = result

        patient = Patient(
            medical_record_number=data.medical_record_number,
            full_name=data.full_name,
            date_of_birth=data.date_of_birth,
            gender=data.gender,
            phone_number=phone,
            emergency_contact=data.emergency_contact,
            dry_weight=data.dry_weight,
            dry_weight_updated_at=datetime.now(timezone.utc),
            dry_weight_updated_by=created_by.id,
            vascular_access_type=data.vascular_access_type,
            dialysis_frequency_per_week=data.dialysis_frequency_per_week,
            dialysis_start_date=data.dialysis_start_date,
            comorbidities=data.comorbidities,
            clinical_notes=data.clinical_notes,
            assigned_clinician_id=(
                data.assigned_clinician_id or created_by.id
            ),
            is_active=True,
        )

        db.add(patient)
        db.flush()

        audit_logger.log_create(
            db=db,
            user_id=created_by.id,
            entity_type="Patient",
            entity_id=str(patient.id),
            new_values={
                "medical_record_number": patient.medical_record_number,
                "full_name": patient.full_name,
                "dry_weight": patient.dry_weight,
            },
            request=request,
        )

        db.commit()
        db.refresh(patient)
        return patient

    # ============================================================
    # READ
    # ============================================================
    def get_patient_by_id(
        self,
        db: Session,
        patient_id: uuid.UUID,
        active_only: bool = True,
    ) -> Patient:
        """دریافت بیمار با ID"""
        query = db.query(Patient).filter(Patient.id == patient_id)
        if active_only:
            query = query.filter(Patient.is_active == True)

        patient = query.first()
        if not patient:
            raise PatientNotFoundException(
                f"بیمار با شناسه {patient_id} یافت نشد"
            )
        return patient

    def get_patient_by_mrn(
        self,
        db: Session,
        mrn: str,
    ) -> Optional[Patient]:
        """دریافت بیمار با کد بیمارستانی"""
        return db.query(Patient).filter(
            Patient.medical_record_number == mrn,
            Patient.is_active == True,
        ).first()

    def get_patients_list(
        self,
        db: Session,
        page: int = 1,
        size: int = 20,
        clinician_id: Optional[uuid.UUID] = None,
        active_only: bool = True,
    ) -> tuple[list[Patient], int]:
        """
        لیست بیماران با pagination

        Returns:
            (patients, total_count)
        """
        query = db.query(Patient)

        if active_only:
            query = query.filter(Patient.is_active == True)

        if clinician_id:
            query = query.filter(
                Patient.assigned_clinician_id == clinician_id
            )

        total = query.count()
        patients = (
            query
            .order_by(Patient.full_name)
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )

        return patients, total

    def search_patients(
        self,
        db: Session,
        query_str: str,
        limit: int = 20,
    ) -> list[Patient]:
        """
        جستجوی بیمار بر اساس نام، کد بیمارستانی یا شماره تلفن
        """
        search = f"%{query_str}%"
        return (
            db.query(Patient)
            .filter(
                Patient.is_active == True,
                or_(
                    Patient.full_name.ilike(search),
                    Patient.medical_record_number.ilike(search),
                    Patient.phone_number.ilike(search),
                ),
            )
            .limit(limit)
            .all()
        )

    def get_patient_summary(
        self,
        db: Session,
        patient_id: uuid.UUID,
    ) -> dict:
        """
        خلاصه کامل وضعیت بیمار برای داشبورد

        شامل:
        - آمار هشدارهای فعال
        - آخرین جلسه دیالیز
        - آخرین آزمایش‌ها
        - تعداد توصیه‌های در انتظار
        """
        patient = self.get_patient_by_id(db, patient_id)

        # آمار هشدارها
        alert_stats = (
            db.query(
                Alert.severity,
                func.count(Alert.id).label("count"),
            )
            .filter(
                Alert.patient_id == patient_id,
                Alert.status == AlertStatus.NEW,
            )
            .group_by(Alert.severity)
            .all()
        )

        alert_counts = {
            AlertSeverity.HIGH: 0,
            AlertSeverity.MEDIUM: 0,
            AlertSeverity.LOW: 0,
        }
        for severity, count in alert_stats:
            alert_counts[severity] = count

        # توصیه‌های در انتظار
        pending_recs = db.query(func.count(Recommendation.id)).filter(
            Recommendation.patient_id == patient_id,
            Recommendation.status == RecommendationStatus.DRAFT,
        ).scalar()

        # آخرین جلسه دیالیز
        last_session = (
            db.query(DialysisSession)
            .filter(DialysisSession.patient_id == patient_id)
            .order_by(DialysisSession.session_date.desc())
            .first()
        )

        # آخرین پنل آزمایش
        last_panel = (
            db.query(LabPanel)
            .filter(LabPanel.patient_id == patient_id)
            .order_by(LabPanel.collected_at.desc())
            .first()
        )

        return {
            "patient": patient,
            "alert_counts": {
                "high": alert_counts[AlertSeverity.HIGH],
                "medium": alert_counts[AlertSeverity.MEDIUM],
                "low": alert_counts[AlertSeverity.LOW],
                "total": sum(alert_counts.values()),
            },
            "pending_recommendations": pending_recs or 0,
            "last_session": last_session,
            "last_panel": last_panel,
        }

    # ============================================================
    # UPDATE
    # ============================================================
    def update_patient(
        self,
        db: Session,
        patient_id: uuid.UUID,
        data: PatientUpdateRequest,
        updated_by: User,
        request: Optional[Request] = None,
    ) -> Patient:
        """
        به‌روزرسانی اطلاعات بیمار

        نکته: تغییر dry_weight لاگ جداگانه می‌خورد
        """
        patient = self.get_patient_by_id(db, patient_id)

        old_values = {
            "full_name": patient.full_name,
            "dry_weight": patient.dry_weight,
            "vascular_access_type": (
                patient.vascular_access_type.value
                if patient.vascular_access_type else None
            ),
        }

        update_data = data.model_dump(exclude_unset=True)

        # بررسی تغییر dry_weight
        if "dry_weight" in update_data:
            new_dw = update_data["dry_weight"]
            if new_dw != patient.dry_weight:
                is_valid, errors = validate_dry_weight(new_dw)
                if not is_valid:
                    from app.exceptions.business_exceptions import InvalidWeightException
                    raise InvalidWeightException(
                        message="; ".join(errors),
                        details={"dry_weight": new_dw, "errors": errors},
                    )

                # لاگ تغییر وزن خشک جداگانه
                audit_logger.log(
                    db=db,
                    action="DRY_WEIGHT_CHANGED",
                    entity_type="Patient",
                    entity_id=str(patient.id),
                    user_id=updated_by.id,
                    old_values={"dry_weight": patient.dry_weight},
                    new_values={"dry_weight": new_dw},
                    description=(
                        f"وزن خشک از {patient.dry_weight} kg "
                        f"به {new_dw} kg تغییر کرد"
                    ),
                    request=request,
                )

                patient.dry_weight_updated_at = datetime.now(timezone.utc)
                patient.dry_weight_updated_by = updated_by.id

        # اعمال تغییرات
        for field, value in update_data.items():
            setattr(patient, field, value)

        new_values = {
            "full_name": patient.full_name,
            "dry_weight": patient.dry_weight,
            "vascular_access_type": (
                patient.vascular_access_type.value
                if patient.vascular_access_type else None
            ),
        }

        audit_logger.log_update(
            db=db,
            user_id=updated_by.id,
            entity_type="Patient",
            entity_id=str(patient.id),
            old_values=old_values,
            new_values=new_values,
            request=request,
        )

        db.commit()
        db.refresh(patient)
        return patient

    def deactivate_patient(
        self,
        db: Session,
        patient_id: uuid.UUID,
        deactivated_by: User,
        request: Optional[Request] = None,
    ) -> Patient:
        """غیرفعال کردن بیمار (soft delete)"""
        patient = self.get_patient_by_id(db, patient_id)

        patient.is_active = False

        audit_logger.log(
            db=db,
            action="DEACTIVATE",
            entity_type="Patient",
            entity_id=str(patient.id),
            user_id=deactivated_by.id,
            description=f"بیمار {patient.full_name} غیرفعال شد",
            request=request,
        )

        db.commit()
        db.refresh(patient)
        return patient

    def assign_user_account(
        self,
        db: Session,
        patient_id: uuid.UUID,
        user_id: uuid.UUID,
        assigned_by: User,
    ) -> Patient:
        """لینک کردن حساب کاربری به پرونده بیمار"""
        patient = self.get_patient_by_id(db, patient_id)

        # بررسی اینکه user وجود دارد و نقش patient دارد
        user = db.query(User).filter(
            User.id == user_id,
            User.role == UserRole.PATIENT,
        ).first()

        if not user:
            raise ValueError(
                "کاربر مورد نظر یافت نشد یا نقش بیمار ندارد"
            )

        patient.user_id = user_id

        audit_logger.log(
            db=db,
            action="LINK_USER_ACCOUNT",
            entity_type="Patient",
            entity_id=str(patient.id),
            user_id=assigned_by.id,
            new_values={"user_id": str(user_id)},
        )

        db.commit()
        db.refresh(patient)
        return patient


# Singleton
patient_service = PatientService()