"""
سرویس نتایج آزمایشگاهی

مدیریت کامل آزمایش‌های دوره‌ای بیماران دیالیزی
"""

import uuid
from datetime import date
from typing import Optional

from fastapi import Request
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.infrastructure.auditing.logger import audit_logger
from app.models.lab_result import LabPanel, LabReferenceRange, LabResult
from app.models.patient import Patient
from app.models.user import User
from app.schemas.lab_result import LabPanelCreateRequest
from app.shared.constants import LAB_NAMES_FA, LAB_UNITS
from app.shared.enums import LabTestCode
from app.shared.utils import classify_trend_direction
from app.validators.lab_validator import validate_lab_panel, validate_lab_value
from app.exceptions.business_exceptions import PatientNotFoundException


class LabService:

    # ============================================================
    # CREATE
    # ============================================================
    def create_lab_panel(
        self,
        db: Session,
        patient_id: uuid.UUID,
        data: LabPanelCreateRequest,
        recorded_by: User,
        request: Optional[Request] = None,
    ) -> LabPanel:
        """
        ثبت پنل آزمایش جدید

        مراحل:
        1. اعتبارسنجی هر تست + cross-check ترکیبی
        2. دریافت ref range از DB
        3. محاسبه is_abnormal, is_critical
        4. ذخیره panel + results
        5. Trigger تحلیل
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
        # اعتبارسنجی کامل پنل
        # ============================================================
        results_raw = [
            {
                "test_code": r.test_code,
                "value": r.value,
                "unit": r.unit,
            }
            for r in data.results
        ]

        panel_validation = validate_lab_panel(results_raw, db)

        if not panel_validation.is_valid:
            from app.exceptions.business_exceptions import InvalidLabValueException
            raise InvalidLabValueException(
                message="; ".join(panel_validation.errors),
                details={"errors": panel_validation.errors},
            )

        # ============================================================
        # ایجاد Panel
        # ============================================================
        panel = LabPanel(
            patient_id=patient_id,
            collected_at=data.collected_at,
            reported_at=data.reported_at,
            notes=data.notes,
            recorded_by=recorded_by.id,
        )
        db.add(panel)
        db.flush()

        # ============================================================
        # ایجاد نتایج با ref range از DB
        # ============================================================
        for result_data in data.results:
            validation = panel_validation.results.get(result_data.test_code)

            # دریافت ref range از DB
            ref = db.query(LabReferenceRange).filter(
                LabReferenceRange.test_code == result_data.test_code,
                LabReferenceRange.is_active == True,
            ).first()

            ref_low = ref.normal_low if ref else None
            ref_high = ref.normal_high if ref else None

            # تعیین واحد استاندارد
            standard_unit = LAB_UNITS.get(result_data.test_code, result_data.unit)

            result = LabResult(
                panel_id=panel.id,
                patient_id=patient_id,
                test_code=result_data.test_code,
                value=result_data.value,
                unit=standard_unit,
                ref_range_low=ref_low,
                ref_range_high=ref_high,
                is_abnormal=validation.is_abnormal if validation else False,
                is_critical=validation.is_critical if validation else False,
                abnormality_direction=validation.abnormality_direction if validation else None,
                note=result_data.note,
            )
            db.add(result)

        db.flush()

        audit_logger.log_create(
            db=db,
            user_id=recorded_by.id,
            entity_type="LabPanel",
            entity_id=str(panel.id),
            new_values={
                "patient_id": str(patient_id),
                "collected_at": str(data.collected_at),
                "test_count": len(data.results),
                "cross_warnings": panel_validation.cross_check_warnings,
            },
            request=request,
        )

        db.commit()
        db.refresh(panel)

        # Trigger تحلیل
        self._trigger_analysis(panel.id, patient_id)

        return panel

    def _trigger_analysis(
        self,
        panel_id: uuid.UUID,
        patient_id: uuid.UUID,
    ) -> None:
        try:
            from app.tasks.analysis_tasks import analyze_lab_panel
            analyze_lab_panel.delay(str(panel_id))
        except Exception:
            pass

    # ============================================================
    # READ
    # ============================================================
    def get_panels(
        self,
        db: Session,
        patient_id: uuid.UUID,
        page: int = 1,
        size: int = 10,
    ) -> tuple[list[LabPanel], int]:
        """لیست پنل‌های آزمایش"""
        query = db.query(LabPanel).filter(
            LabPanel.patient_id == patient_id
        )
        total = query.count()
        panels = (
            query
            .order_by(desc(LabPanel.collected_at))
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )
        return panels, total

    def get_panel_by_id(
        self,
        db: Session,
        panel_id: uuid.UUID,
        patient_id: uuid.UUID,
    ) -> LabPanel:
        """دریافت پنل با ID"""
        panel = db.query(LabPanel).filter(
            LabPanel.id == panel_id,
            LabPanel.patient_id == patient_id,
        ).first()

        if not panel:
            raise ValueError("پنل آزمایش یافت نشد")

        return panel

    def get_latest_results(
        self,
        db: Session,
        patient_id: uuid.UUID,
    ) -> dict[str, dict]:
        """
        آخرین مقدار هر آزمایش برای داشبورد

        Returns:
            {test_code: {value, unit, date, is_abnormal, status_fa}}
        """
        result_map = {}

        for test_code in LabTestCode:
            latest = (
                db.query(LabResult)
                .filter(
                    LabResult.patient_id == patient_id,
                    LabResult.test_code == test_code.value,
                )
                .order_by(desc(LabResult.created_at))
                .first()
            )

            if latest:
                result_map[test_code.value] = {
                    "test_code": test_code.value,
                    "test_name_fa": LAB_NAMES_FA.get(test_code.value, test_code.value),
                    "value": latest.value,
                    "unit": latest.unit,
                    "date": str(latest.panel.collected_at) if latest.panel else None,
                    "is_abnormal": latest.is_abnormal,
                    "is_critical": latest.is_critical,
                    "abnormality_direction": latest.abnormality_direction,
                    "status_fa": latest.status_fa,
                    "ref_range_low": latest.ref_range_low,
                    "ref_range_high": latest.ref_range_high,
                }

        return result_map

    def get_lab_trend(
        self,
        db: Session,
        patient_id: uuid.UUID,
        test_code: str,
        n_results: int = 6,
    ) -> dict:
        """
        روند یک آزمایش مشخص در n نتیجه اخیر

        برای نمودار در اپ بیمار
        """
        results = (
            db.query(LabResult)
            .join(LabPanel)
            .filter(
                LabResult.patient_id == patient_id,
                LabResult.test_code == test_code,
            )
            .order_by(desc(LabPanel.collected_at))
            .limit(n_results)
            .all()
        )

        results = list(reversed(results))

        if not results:
            return {
                "test_code": test_code,
                "test_name_fa": LAB_NAMES_FA.get(test_code, test_code),
                "unit": LAB_UNITS.get(test_code, ""),
                "points": [],
                "trend_direction": None,
                "latest_value": None,
                "normal_low": None,
                "normal_high": None,
            }

        # ref range
        ref = db.query(LabReferenceRange).filter(
            LabReferenceRange.test_code == test_code
        ).first()

        values = [r.value for r in results]
        trend = None
        if len(values) >= 3:
            trend = classify_trend_direction(values)

        return {
            "test_code": test_code,
            "test_name_fa": LAB_NAMES_FA.get(test_code, test_code),
            "unit": results[0].unit if results else LAB_UNITS.get(test_code, ""),
            "points": [
                {
                    "date": str(r.panel.collected_at) if r.panel else None,
                    "value": r.value,
                    "is_abnormal": r.is_abnormal,
                    "is_critical": r.is_critical,
                }
                for r in results
            ],
            "trend_direction": trend.value if trend else None,
            "latest_value": values[-1] if values else None,
            "normal_low": ref.normal_low if ref else None,
            "normal_high": ref.normal_high if ref else None,
        }

    def get_cross_check_warnings(
        self,
        db: Session,
        patient_id: uuid.UUID,
    ) -> list[str]:
        """
        بررسی ترکیبی آخرین آزمایش‌ها برای cross-check warnings

        برای تحلیل جاری بیمار (نه یک پنل خاص)
        """
        latest = self.get_latest_results(db, patient_id)
        raw_values = {
            code: info["value"]
            for code, info in latest.items()
        }

        results_list = [
            {"test_code": code, "value": val, "unit": LAB_UNITS.get(code, "")}
            for code, val in raw_values.items()
        ]

        panel_val = validate_lab_panel(results_list, db)
        return panel_val.cross_check_warnings


# Singleton
lab_service = LabService()