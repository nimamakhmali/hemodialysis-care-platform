"""
موتور تحلیل مرکزی

orchestrate کردن اجرای تمام Rules روی Context
و تبدیل نتایج به Alert/Recommendation
"""

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

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
    HyperkalemiaRule,
    HyperphosphatemiaRule,
    HyperphosphatemiaWithPoorDietRule,
    HypoalbuminemiaRule,
    HypokalemiaRule,
    IronDeficiencyRule,
    RenalOsteodystrophyRule,
    CaPProductRule,
    InflammationVsMalnutritionRule,
)
from app.analysis.rules.symptom_rules import (
    DangerSymptomRule,
    FluidOverloadPatternRule,
    MalnutritionRiskRule,
    RecurrentSymptomsRule,
    AccessSitePainRule,
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
    RecommendationStatus,
)

logger = logging.getLogger(__name__)


class AnalysisEngine:
    """
    موتور تحلیل مرکزی

    مسئولیت‌ها:
    1. ساخت Context از داده‌های DB
    2. اجرای Rules
    3. فیلتر duplicate
    4. ذخیره Alert و Recommendation
    """

    def __init__(self):
        # ثبت تمام Rules
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
            FluidOverloadPatternRule(),
            MalnutritionRiskRule(),
        ]

        self._fluid_rules = [
            # در TASK-021 تکمیل می‌شود
        ]

    # ============================================================
    # Context Builder
    # ============================================================
    def _build_context(
        self,
        db: Session,
        patient: Patient,
        trigger_session_id: Optional[uuid.UUID] = None,
        trigger_panel_id: Optional[uuid.UUID] = None,
        trigger_report_id: Optional[uuid.UUID] = None,
    ) -> RuleContext:
        """
        ساخت Context کامل از DB

        داده‌های لازم برای تمام Rules را یکجا لود می‌کند.
        """
        # ۸ جلسه اخیر
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

        # آخرین مقدار هر آزمایش
        from app.shared.enums import LabTestCode
        latest_labs: dict[str, dict] = {}
        lab_history: dict[str, list[dict]] = {}

        for test_code in LabTestCode:
            results = (
                db.query(LabResult)
                .join(LabPanel)
                .filter(
                    LabResult.patient_id == patient.id,
                    LabResult.test_code == test_code.value,
                )
                .order_by(LabPanel.collected_at.desc())
                .limit(6)
                .all()
            )

            if results:
                latest = results[0]
                latest_labs[test_code.value] = {
                    "value": latest.value,
                    "unit": latest.unit,
                    "date": str(latest.panel.collected_at) if latest.panel else None,
                    "is_abnormal": latest.is_abnormal,
                    "is_critical": latest.is_critical,
                    "direction": latest.abnormality_direction,
                }

                lab_history[test_code.value] = [
                    {
                        "date": str(r.panel.collected_at) if r.panel else None,
                        "value": r.value,
                    }
                    for r in reversed(results)
                ]

        # علائم ۱۴ روز اخیر
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

        recent_symptoms = []
        for r in recent_reports:
            for s in (r.symptoms or []):
                recent_symptoms.append({
                    "type": s.get("type"),
                    "severity": s.get("severity"),
                    "reported_at": r.reported_at.isoformat(),
                })

        # خلاصه مایعات و رژیم
        from app.services.fluid_service import fluid_service
        from app.services.diet_service import diet_service

        avg_fluid = fluid_service.get_avg_fluid_last_n_days(db, patient.id, 7)
        diet_summary = diet_service.get_adherence_summary(db, patient.id, 30)

        # جلسه trigger (اگر از session آمده)
        current_session = None
        if trigger_session_id and recent_sessions:
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
    def run_for_session(
        self,
        db: Session,
        session_id: uuid.UUID,
    ) -> list[Alert]:
        """اجرای تحلیل بعد از ثبت جلسه دیالیز"""
        session = db.query(DialysisSession).get(session_id)
        if not session:
            logger.warning(f"Session {session_id} یافت نشد")
            return []

        patient = db.query(Patient).get(session.patient_id)
        if not patient:
            return []

        context = self._build_context(
            db=db,
            patient=patient,
            trigger_session_id=session_id,
        )

        results = [
            rule.safe_evaluate(context)
            for rule in self._session_rules
        ]

        return self._process_results(db, patient, results)

    def run_for_lab_panel(
        self,
        db: Session,
        panel_id: uuid.UUID,
    ) -> list[Alert]:
        """اجرای تحلیل بعد از ثبت پنل آزمایش"""
        panel = db.query(LabPanel).get(panel_id)
        if not panel:
            return []

        patient = db.query(Patient).get(panel.patient_id)
        if not patient:
            return []

        context = self._build_context(
            db=db,
            patient=patient,
            trigger_panel_id=panel_id,
        )

        results = [
            rule.safe_evaluate(context)
            for rule in self._lab_rules
        ]

        return self._process_results(db, patient, results)

    def run_for_symptoms(
        self,
        db: Session,
        report_id: uuid.UUID,
    ) -> list[Alert]:
        """اجرای تحلیل بعد از ثبت گزارش علائم"""
        report = db.query(SymptomReport).get(report_id)
        if not report:
            return []

        patient = db.query(Patient).get(report.patient_id)
        if not patient:
            return []

        context = self._build_context(
            db=db,
            patient=patient,
            trigger_report_id=report_id,
        )

        results = [
            rule.safe_evaluate(context)
            for rule in self._symptom_rules
        ]

        return self._process_results(db, patient, results)

    def run_for_fluid(
        self,
        db: Session,
        patient_id: uuid.UUID,
    ) -> list[Alert]:
        """اجرای تحلیل بعد از ثبت مایعات"""
        patient = db.query(Patient).get(patient_id)
        if not patient:
            return []

        context = self._build_context(db=db, patient=patient)

        # fluid + cross-domain با session
        rules = self._fluid_rules + [FluidOverloadPatternRule()]
        results = [rule.safe_evaluate(context) for rule in rules]

        return self._process_results(db, patient, results)

    # ============================================================
    # Process Results
    # ============================================================
    def _process_results(
        self,
        db: Session,
        patient: Patient,
        results: list[RuleResult],
    ) -> list[Alert]:
        """
        تبدیل RuleResult‌ها به Alert و Recommendation

        مراحل:
        1. فیلتر triggered=False
        2. جلوگیری از duplicate (همان rule در ۲۴ ساعت)
        3. ذخیره Alert
        4. ذخیره Recommendation Draft برای HIGH alerts
        """
        triggered = [r for r in results if r.triggered]
        if not triggered:
            return []

        created_alerts = []

        for result in triggered:
            # بررسی duplicate
            if self._is_duplicate(db, patient.id, result.rule_name):
                logger.debug(
                    f"Rule '{result.rule_name}' برای {patient.full_name} "
                    f"در ۲۴ ساعت گذشته اجرا شده — duplicate skip"
                )
                continue

            # ایجاد Alert
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

            # ایجاد Recommendation Draft برای HIGH و MEDIUM alerts
            if result.severity in (AlertSeverity.HIGH, AlertSeverity.MEDIUM):
                if result.recommendation_draft:
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
        """
        بررسی duplicate Alert

        جلوگیری از ایجاد هشدار تکراری برای همان rule
        در بازه ۲۴ ساعت
        """
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        existing = db.query(Alert).filter(
            Alert.patient_id == patient_id,
            Alert.triggered_by_rule == rule_name,
            Alert.status != AlertStatus.RESOLVED,
            Alert.created_at >= cutoff,
        ).first()

        return existing is not None


    # در AnalysisEngine._process_results اضافه کنید:

    def run_full_analysis(
        self,
        db: Session,
        patient_id: UUID,
    ) -> dict:
        """
        تحلیل کامل یک بیمار:
        - اجرای همه Rules
        - تحلیل روند
        - محاسبه نمره ریسک
        """
        from app.analysis.trends import trend_analyzer
        from app.analysis.risk import risk_scorer

        patient = db.query(Patient).get(patient_id)
        if not patient:
            return {}

        context = self._build_context(db, patient)

        # اجرای همه Rules
        all_results = []
        for rule in (
            self._session_rules
            + self._lab_rules
            + self._symptom_rules
            + self._fluid_rules
        ):
            all_results.append(rule.safe_evaluate(context))

        alerts = self._process_results(db, patient, all_results)

        # تحلیل روند
        trend_summary = trend_analyzer.detect_gradual_deterioration(
            db, patient_id
        )

        # نمره ریسک
        risk = risk_scorer.calculate_risk_score(db, patient_id)

        return {
            "alerts_created": len(alerts),
            "trend_summary": trend_summary,
            "risk_score": risk,
        }

# Singleton
analysis_engine = AnalysisEngine()