# ============================================================
# app/analysis/engine.py — نسخه refactor شده
# ============================================================
"""
موتور تحلیل مرکزی — بدون N+1 query و بدون circular import
"""

import logging
import uuid
from datetime import datetime, timedelta, timezone
from itertools import groupby
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.analysis.rules.base import RuleContext, RuleResult
from app.analysis.rules.bp_rules import (
    BPTrendRule,
    IntradialyticHypotensionRule,
    PostDialysisHypotensionRule,
    PreDialysisHypertensionRule,
    PreDialysisHypotensionRule,
)
from app.analysis.rules.lab_rules import (
    AnemiaRule,
    AnemiaTrendRule,
    CaPProductRule,
    HyperkalemiaRule,
    HyperphosphatemiaRule,
    HyperphosphatemiaWithPoorDietRule,
    HypoalbuminemiaRule,
    HypokalemiaRule,
    InflammationVsMalnutritionRule,
    IronDeficiencyRule,
    RenalOsteodystrophyRule,
)
from app.analysis.rules.symptom_rules import (
    AccessSitePainRule,
    DangerSymptomRule,
    RecurrentSymptomsRule,
)
from app.analysis.rules.weight_rules import (
    ConsecutiveHighIDWGRule,
    IDWGCriticalRule,
    IDWGWarningRule,
    PostWeightFarFromDryRule,
)
from app.models.alert import Alert
from app.models.dialysis_session import DialysisSession
from app.models.lab_result import LabPanel, LabResult
from app.models.patient import Patient
from app.models.recommendation import Recommendation
from app.models.symptom_report import SymptomReport
from app.shared.enums import (
    AlertCategory,
    AlertSeverity,
    AlertStatus,
    LabTestCode,
    RecommendationStatus,
)

logger = logging.getLogger(__name__)


class AnalysisEngine:

    def __init__(self):
        self._session_rules = [
            IDWGWarningRule(),
            IDWGCriticalRule(),
            ConsecutiveHighIDWGRule(),
            PostWeightFarFromDryRule(),
            PreDialysisHypertensionRule(),
            PreDialysisHypotensionRule(),
            IntradialyticHypotensionRule(),
            PostDialysisHypotensionRule(),
            BPTrendRule(),
        ]

        self._lab_rules = [
            HyperkalemiaRule(),
            HypokalemiaRule(),
            HyperphosphatemiaRule(),
            HyperphosphatemiaWithPoorDietRule(),
            AnemiaRule(),
            AnemiaTrendRule(),
            HypoalbuminemiaRule(),
            IronDeficiencyRule(),
            RenalOsteodystrophyRule(),
            CaPProductRule(),
            InflammationVsMalnutritionRule(),
        ]

        self._symptom_rules = [
            DangerSymptomRule(),
            RecurrentSymptomsRule(),
            AccessSitePainRule(),
        ]

    # ============================================================
    # Context Builder — بدون N+1 query
    # ============================================================
    def _build_context(
        self,
        db: Session,
        patient: Patient,
        trigger_session_id: Optional[uuid.UUID] = None,
    ) -> RuleContext:

        # ۸ جلسه اخیر — یک query
        recent_sessions_db = (
            db.query(DialysisSession)
            .filter(DialysisSession.patient_id == patient.id)
            .order_by(DialysisSession.session_date.desc())
            .limit(8)
            .all()
        )

        recent_sessions = [
            {
                "id": str(s.id),
                "date": str(s.session_date),
                "pre_weight": s.pre_weight,
                "post_weight": s.post_weight,
                "dry_weight": s.dry_weight_at_session,
                "weight_gain": s.weight_gain,
                "weight_gain_percent": s.weight_gain_percent,
                "uf_volume": s.uf_volume,
                "bp_pre_systolic": s.bp_pre_systolic,
                "bp_pre_diastolic": s.bp_pre_diastolic,
                "bp_during_systolic": s.bp_during_systolic,
                "bp_during_diastolic": s.bp_during_diastolic,
                "bp_post_systolic": s.bp_post_systolic,
                "bp_post_diastolic": s.bp_post_diastolic,
                "bp_drop_during": s.bp_drop_during,
                "had_idh": s.had_intradialytic_hypotension,
                "intradialytic_events": s.intradialytic_events or [],
            }
            for s in recent_sessions_db
        ]

        # همه آزمایش‌ها — یک query برای همه test_code ها
        latest_labs: dict[str, dict] = {}
        lab_history: dict[str, list[dict]] = {}

        all_results = (
            db.query(LabResult, LabPanel.collected_at)
            .join(LabPanel, LabResult.panel_id == LabPanel.id)
            .filter(LabResult.patient_id == patient.id)
            .order_by(LabResult.test_code, LabPanel.collected_at.desc())
            .limit(140)  # 14 تست × 10 نتیجه
            .all()
        )

        # groupby در Python
        for test_code, group in groupby(all_results, key=lambda x: x[0].test_code):
            group_list = list(group)
            if not group_list:
                continue

            latest_result, latest_date = group_list[0]
            latest_labs[test_code] = {
                "value": latest_result.value,
                "unit": latest_result.unit,
                "date": str(latest_date),
                "is_abnormal": latest_result.is_abnormal,
                "is_critical": latest_result.is_critical,
                "direction": latest_result.abnormality_direction,
            }

            # تاریخچه از قدیم به جدید
            lab_history[test_code] = [
                {"date": str(date_val), "value": r.value}
                for r, date_val in reversed(group_list)
            ]

        # علائم ۱۴ روز — یک query
        two_weeks_ago = datetime.now(timezone.utc) - timedelta(days=14)
        recent_reports = (
            db.query(SymptomReport)
            .filter(
                SymptomReport.patient_id == patient.id,
                SymptomReport.reported_at >= two_weeks_ago,
            )
            .order_by(SymptomReport.reported_at.desc())
            .limit(20)
            .all()
        )

        recent_symptoms = [
            {
                "type": s.get("type"),
                "severity": s.get("severity"),
                "reported_at": r.reported_at.isoformat(),
            }
            for r in recent_reports
            for s in (r.symptoms or [])
        ]

        # مایعات و رژیم — query مستقیم بدون import از services
        from app.models.fluid_log import FluidLog
        from app.models.diet_log import DietLog
        from sqlalchemy import func as sqlfunc
        import datetime as dt

        seven_days_ago = dt.date.today() - timedelta(days=7)
        avg_fluid_result = (
            db.query(sqlfunc.avg(FluidLog.total_ml))
            .filter(
                FluidLog.patient_id == patient.id,
                FluidLog.log_date >= seven_days_ago,
            )
            .scalar()
        )
        avg_fluid = round(float(avg_fluid_result), 1) if avg_fluid_result else None

        thirty_days_ago = dt.date.today() - timedelta(days=30)
        diet_logs = (
            db.query(DietLog)
            .filter(
                DietLog.patient_id == patient.id,
                DietLog.log_date >= thirty_days_ago,
            )
            .all()
        )

        diet_summary = None
        if diet_logs:
            from app.shared.enums import DietAdherence
            poor_p = sum(
                1 for log in diet_logs
                if log.phosphorus_adherence == DietAdherence.POOR
            )
            diet_summary = {
                "total_logs": len(diet_logs),
                "phosphorus_poor_rate": round(poor_p / len(diet_logs) * 100, 1),
            }

        # جلسه trigger
        current_session = None
        if trigger_session_id:
            for s in recent_sessions:
                if s["id"] == str(trigger_session_id):
                    current_session = s
                    break

        return RuleContext(
            patient_id=str(patient.id),
            patient_full_name=patient.full_name,
            dry_weight=patient.dry_weight,
            current_session=current_session,
            recent_sessions=recent_sessions,
            latest_labs=latest_labs,
            lab_history=lab_history,
            recent_symptoms=recent_symptoms,
            fluid_summary={"avg_7d_ml": avg_fluid} if avg_fluid else None,
            diet_summary=diet_summary,
        )

    # ============================================================
    # Run Methods
    # ============================================================
    def run_for_session(self, db: Session, session_id: uuid.UUID) -> list[Alert]:
        session = db.query(DialysisSession).get(session_id)
        if not session:
            logger.warning(f"Session {session_id} یافت نشد")
            return []

        patient = db.query(Patient).get(session.patient_id)
        if not patient:
            return []

        context = self._build_context(db, patient, trigger_session_id=session_id)
        results = [rule.safe_evaluate(context) for rule in self._session_rules]
        return self._process_results(db, patient, results)

    def run_for_lab_panel(self, db: Session, panel_id: uuid.UUID) -> list[Alert]:
        panel = db.query(LabPanel).get(panel_id)
        if not panel:
            return []

        patient = db.query(Patient).get(panel.patient_id)
        if not patient:
            return []

        context = self._build_context(db, patient)
        results = [rule.safe_evaluate(context) for rule in self._lab_rules]
        return self._process_results(db, patient, results)

    def run_for_symptoms(self, db: Session, report_id: uuid.UUID) -> list[Alert]:
        report = db.query(SymptomReport).get(report_id)
        if not report:
            return []

        patient = db.query(Patient).get(report.patient_id)
        if not patient:
            return []

        context = self._build_context(db, patient)
        results = [rule.safe_evaluate(context) for rule in self._symptom_rules]
        return self._process_results(db, patient, results)

    def run_for_fluid(self, db: Session, patient_id: uuid.UUID) -> list[Alert]:
        patient = db.query(Patient).get(patient_id)
        if not patient:
            return []

        context = self._build_context(db, patient)
        # fluid rules در TASK-021 اضافه می‌شود
        return []

    # ============================================================
    # Process Results
    # ============================================================
    def _process_results(
        self,
        db: Session,
        patient: Patient,
        results: list[RuleResult],
    ) -> list[Alert]:
        triggered = [r for r in results if r.triggered]
        if not triggered:
            return []

        created_alerts: list[Alert] = []

        for result in triggered:
            if self._is_duplicate(db, patient.id, result.rule_name):
                logger.debug(
                    f"Rule '{result.rule_name}' duplicate — skip"
                )
                continue

            alert = Alert(
                patient_id=patient.id,
                severity=result.severity,
                category=result.category,
                title=result.title,
                clinician_explanation=result.clinician_explanation,
                evidence=result.evidence,
                triggered_by_rule=result.rule_name,
                status=AlertStatus.NEW,
            )
            db.add(alert)
            db.flush()
            created_alerts.append(alert)

            if (
                result.severity in (AlertSeverity.HIGH, AlertSeverity.MEDIUM)
                and result.recommendation_draft
            ):
                rec = Recommendation(
                    patient_id=patient.id,
                    alert_id=alert.id,
                    draft_for_clinician=result.recommendation_draft,
                    patient_content=result.patient_message_draft,
                    education_topic=result.education_topic,
                    status=RecommendationStatus.DRAFT,
                    priority=result.severity,
                )
                db.add(rec)

        db.commit()
        return created_alerts

    def _is_duplicate(
        self,
        db: Session,
        patient_id: uuid.UUID,
        rule_name: str,
        hours: int = 24,
    ) -> bool:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        return db.query(Alert).filter(
            Alert.patient_id == patient_id,
            Alert.triggered_by_rule == rule_name,
            Alert.status != AlertStatus.RESOLVED,
            Alert.created_at >= cutoff,
        ).first() is not None


analysis_engine = AnalysisEngine()