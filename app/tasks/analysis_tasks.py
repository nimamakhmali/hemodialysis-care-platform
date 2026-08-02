"""
Celery Tasks برای تحلیل بالینی

هر task:
1. از DB داده می‌گیرد
2. Analysis Engine را اجرا می‌کند
3. Alert/Recommendation ایجاد می‌کند
4. خطاها را log می‌کند و retry می‌کند
"""

import logging
import uuid
from datetime import date, datetime, timedelta, timezone

from celery import shared_task
from sqlalchemy.orm import Session

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


def _get_db() -> Session:
    """دریافت DB session برای Celery tasks"""
    from app.config.database import SessionLocal
    return SessionLocal()


# ============================================================
# TASK: تحلیل جلسه دیالیز
# ============================================================

@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="analysis",
    name="app.tasks.analysis_tasks.analyze_session",
)
def analyze_session(self, session_id: str) -> dict:
    """
    تحلیل کامل یک جلسه دیالیز

    Trigger: بعد از ثبت جلسه توسط کلینیسین
    اجرا می‌کند:
    - Weight Rules (IDWG, Post-weight)
    - BP Rules (Hypertension, IDH, Post-hypotension)
    - Trend Analysis (وزن و BP در جلسات اخیر)
    - ایجاد Alert/Recommendation
    """
    db = _get_db()
    try:
        from app.analysis.engine import analysis_engine

        logger.info(f"شروع تحلیل جلسه: {session_id}")

        alerts = analysis_engine.run_for_session(
            db=db,
            session_id=uuid.UUID(session_id),
        )

        logger.info(
            f"تحلیل جلسه {session_id} کامل شد. "
            f"Alert ایجادشده: {len(alerts)}"
        )

        return {
            "session_id": session_id,
            "alerts_created": len(alerts),
            "alert_ids": [str(a.id) for a in alerts],
        }

    except Exception as exc:
        logger.error(
            f"خطا در تحلیل جلسه {session_id}: {exc}",
            exc_info=True,
        )
        raise self.retry(exc=exc)

    finally:
        db.close()


# ============================================================
# TASK: تحلیل پنل آزمایش
# ============================================================

@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="analysis",
    name="app.tasks.analysis_tasks.analyze_lab_panel",
)
def analyze_lab_panel(self, panel_id: str) -> dict:
    """
    تحلیل کامل یک پنل آزمایش

    Trigger: بعد از ثبت آزمایش توسط کلینیسین
    اجرا می‌کند:
    - Lab Rules (K, P, Hb, Alb, ...)
    - Cross-domain Rules (Ca×P, Alb+CRP, ...)
    - Trend Analysis آزمایش‌های تغییرکرده
    - Risk Score محاسبه و ذخیره
    - ایجاد Alert/Recommendation
    """
    db = _get_db()
    try:
        from app.analysis.engine import analysis_engine
        from app.analysis.risk import risk_scorer

        logger.info(f"شروع تحلیل آزمایش: {panel_id}")

        # اجرای Lab Rules
        alerts = analysis_engine.run_for_lab_panel(
            db=db,
            panel_id=uuid.UUID(panel_id),
        )

        # دریافت patient_id از panel
        from app.models.lab_result import LabPanel
        panel = db.query(LabPanel).filter(
            LabPanel.id == uuid.UUID(panel_id)
        ).first()

        risk_score = None
        if panel:
            # محاسبه Risk Score بعد از آزمایش جدید
            try:
                risk = risk_scorer.calculate_risk_score(
                    db=db,
                    patient_id=panel.patient_id,
                )
                risk_score = risk.total_score
                logger.info(
                    f"نمره ریسک بیمار {panel.patient_id}: {risk_score:.1f}"
                )
            except Exception as risk_exc:
                logger.warning(
                    f"خطا در محاسبه risk score: {risk_exc}"
                )

        logger.info(
            f"تحلیل آزمایش {panel_id} کامل شد. "
            f"Alert: {len(alerts)}, Risk: {risk_score}"
        )

        return {
            "panel_id": panel_id,
            "alerts_created": len(alerts),
            "risk_score": risk_score,
        }

    except Exception as exc:
        logger.error(
            f"خطا در تحلیل آزمایش {panel_id}: {exc}",
            exc_info=True,
        )
        raise self.retry(exc=exc)

    finally:
        db.close()


# ============================================================
# TASK: تحلیل گزارش علائم
# ============================================================

@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    queue="analysis",
    name="app.tasks.analysis_tasks.analyze_symptoms",
)
def analyze_symptoms(self, report_id: str) -> dict:
    """
    تحلیل گزارش علائم بیمار

    Trigger: بعد از ثبت علائم توسط بیمار
    اجرا می‌کند:
    - Symptom Rules (Danger, Recurrent, Access Site)
    - Cross-domain Rules (Fluid Overload, Malnutrition)
    """
    db = _get_db()
    try:
        from app.analysis.engine import analysis_engine

        logger.info(f"شروع تحلیل علائم: {report_id}")

        alerts = analysis_engine.run_for_symptoms(
            db=db,
            report_id=uuid.UUID(report_id),
        )

        logger.info(
            f"تحلیل علائم {report_id} کامل شد. Alert: {len(alerts)}"
        )

        return {
            "report_id": report_id,
            "alerts_created": len(alerts),
        }

    except Exception as exc:
        logger.error(
            f"خطا در تحلیل علائم {report_id}: {exc}",
            exc_info=True,
        )
        raise self.retry(exc=exc)

    finally:
        db.close()


# ============================================================
# TASK: تحلیل مایعات
# ============================================================

@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="analysis",
    name="app.tasks.analysis_tasks.analyze_fluid",
)
def analyze_fluid(self, log_id: str) -> dict:
    """
    تحلیل ثبت مایعات

    Trigger: بعد از ثبت مصرف مایعات توسط بیمار
    بررسی می‌کند:
    - مصرف زیاد در روز جاری
    - streak روزهای متوالی با مصرف بالا
    - Cross-domain با IDWG آخرین جلسه
    """
    db = _get_db()
    try:
        from app.analysis.engine import analysis_engine
        from app.models.fluid_log import FluidLog

        log = db.query(FluidLog).filter(
            FluidLog.id == uuid.UUID(log_id)
        ).first()

        if not log:
            logger.warning(f"FluidLog {log_id} یافت نشد")
            return {"log_id": log_id, "alerts_created": 0}

        alerts = analysis_engine.run_for_fluid(
            db=db,
            patient_id=log.patient_id,
        )

        return {
            "log_id": log_id,
            "alerts_created": len(alerts),
        }

    except Exception as exc:
        logger.error(f"خطا در تحلیل مایعات {log_id}: {exc}", exc_info=True)
        raise self.retry(exc=exc)

    finally:
        db.close()


# ============================================================
# TASK: تحلیل رژیم غذایی
# ============================================================

@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="analysis",
    name="app.tasks.analysis_tasks.analyze_diet",
)
def analyze_diet(self, log_id: str) -> dict:
    """
    تحلیل ثبت رژیم غذایی

    بررسی می‌کند:
    - streak روزهای متوالی با رعایت POOR
    - Cross-domain با P بالا
    """
    db = _get_db()
    try:
        from app.models.diet_log import DietLog
        from app.services.diet_service import diet_service
        from app.services.alert_service import alert_service
        from app.analysis.rules.base import RuleResult
        from app.shared.enums import AlertCategory, AlertSeverity
        from app.config.thresholds import LAB_THRESHOLDS

        log = db.query(DietLog).filter(
            DietLog.id == uuid.UUID(log_id)
        ).first()

        if not log:
            return {"log_id": log_id, "alerts_created": 0}

        alerts_created = 0

        # بررسی streak رعایت ضعیف فسفر
        p_poor_streak = diet_service.get_poor_adherence_streak(
            db=db,
            patient_id=log.patient_id,
            field="phosphorus_adherence",
            n_days=7,
        )

        if p_poor_streak >= 5:
            from app.analysis.rules.base import RuleResult
            rule_result = RuleResult(
                triggered=True,
                category=AlertCategory.DIET,
                rule_name="POOR_PHOSPHORUS_DIET_STREAK",
                severity=AlertSeverity.MEDIUM,
                title=f"رعایت ضعیف رژیم فسفر: {p_poor_streak} روز متوالی",
                clinician_explanation=(
                    f"بیمار در {p_poor_streak} روز متوالی رعایت ضعیف "
                    f"محدودیت فسفر را گزارش کرده است. "
                    f"بررسی مصرف بایندر و آموزش مجدد توصیه می‌شود."
                ),
                evidence={
                    "phosphorus_poor_streak": p_poor_streak,
                    "date": str(log.log_date),
                },
                education_topic="HIGH_P_BINDER",
                recommendation_draft=(
                    f"📋 رعایت ضعیف مستمر رژیم فسفر\n\n"
                    f"streak: {p_poor_streak} روز\n\n"
                    f"پیشنهاد: جلسه آموزشی + بررسی بایندر"
                ),
            )
            alert = alert_service.create_alert_from_rule(
                db=db,
                patient_id=log.patient_id,
                rule_result=rule_result,
            )
            if alert:
                alerts_created += 1

        return {"log_id": log_id, "alerts_created": alerts_created}

    except Exception as exc:
        logger.error(f"خطا در تحلیل رژیم {log_id}: {exc}", exc_info=True)
        raise self.retry(exc=exc)

    finally:
        db.close()


# ============================================================
# CRON: بررسی روزانه بیماران
# ============================================================

# ============================================================
# app/tasks/analysis_tasks.py — daily_patient_review بهینه‌سازی
# ============================================================

@celery_app.task(
    name="app.tasks.analysis_tasks.daily_patient_review",
    queue="maintenance",
)
def daily_patient_review() -> dict:
    """
    بررسی روزانه — هر بیمار را به عنوان sub-task جداگانه dispatch می‌کند
    تا timeout نخورد و قابل retry باشد
    """
    db = _get_db()
    try:
        from app.models.patient import Patient

        patient_ids = [
            str(p.id)
            for p in db.query(Patient.id).filter(Patient.is_active == True).all()
        ]

        logger.info(f"dispatch بررسی روزانه برای {len(patient_ids)} بیمار")

        # هر بیمار را جداگانه dispatch کن
        for patient_id in patient_ids:
            review_single_patient.delay(patient_id)

        return {"dispatched": len(patient_ids)}

    finally:
        db.close()


@celery_app.task(
    bind=True,
    max_retries=2,
    queue="maintenance",
    name="app.tasks.analysis_tasks.review_single_patient",
)
def review_single_patient(self, patient_id: str) -> dict:
    """بررسی یک بیمار در task مستقل"""
    db = _get_db()
    try:
        from app.models.patient import Patient
        from app.analysis.trends import trend_analyzer

        patient = db.query(Patient).filter(
            Patient.id == uuid.UUID(patient_id)
        ).first()

        if not patient:
            return {"patient_id": patient_id, "skipped": True}

        stats = {"no_data_alerts": 0, "trend_alerts": 0, "overdue_lab_alerts": 0}

        _check_missing_data(db, patient, stats)
        _run_trend_analysis(db, patient, trend_analyzer, stats)
        _check_overdue_labs(db, patient, stats)

        return {"patient_id": patient_id, **stats}

    except Exception as exc:
        logger.error(f"خطا در بررسی بیمار {patient_id}: {exc}", exc_info=True)
        raise self.retry(exc=exc)

    finally:
        db.close()
        
        

def _check_missing_data(db: Session, patient, stats: dict) -> None:
    """بررسی بیمارانی که مدتی داده ثبت نکرده‌اند"""
    from app.models.dialysis_session import DialysisSession
    from app.services.alert_service import alert_service
    from app.analysis.rules.base import RuleResult
    from app.shared.enums import AlertCategory, AlertSeverity

    seven_days_ago = date.today() - timedelta(days=7)

    last_session = (
        db.query(DialysisSession)
        .filter(
            DialysisSession.patient_id == patient.id,
            DialysisSession.session_date >= seven_days_ago,
        )
        .first()
    )

    if last_session:
        return

    # بیمار ۷ روز است جلسه ثبت نشده
    rule_result = RuleResult(
        triggered=True,
        category=AlertCategory.WEIGHT,
        rule_name="NO_SESSION_DATA_7_DAYS",
        severity=AlertSeverity.LOW,
        title="عدم ثبت جلسه دیالیز در ۷ روز اخیر",
        clinician_explanation=(
            f"برای {patient.full_name} در ۷ روز گذشته هیچ جلسه دیالیزی "
            f"ثبت نشده است. لطفاً وضعیت بیمار بررسی شود."
        ),
        evidence={
            "patient_id": str(patient.id),
            "days_without_session": 7,
            "check_date": str(date.today()),
        },
    )

    alert = alert_service.create_alert_from_rule(
        db=db,
        patient_id=patient.id,
        rule_result=rule_result,
        auto_create_recommendation=False,
    )

    if alert:
        stats["no_data_alerts"] += 1


def _run_trend_analysis(
    db: Session,
    patient,
    trend_analyzer,
    stats: dict,
) -> None:
    """اجرای Trend Analysis و تولید Alert برای روندهای نگران‌کننده"""
    from app.services.alert_service import alert_service
    from app.analysis.rules.base import RuleResult
    from app.shared.enums import AlertCategory, AlertSeverity

    try:
        summary = trend_analyzer.detect_gradual_deterioration(
            db=db,
            patient_id=patient.id,
        )

        # اگر روند نگران‌کننده در ۲+ پارامتر داریم
        if not summary.overall_deteriorating:
            return

        concerning_names = [t.test_name_fa for t in summary.concerning_trends[:3]]

        rule_result = RuleResult(
            triggered=True,
            category=AlertCategory.LAB,
            rule_name="GRADUAL_DETERIORATION_TREND",
            severity=AlertSeverity.MEDIUM,
            title=f"روند نگران‌کننده در {len(summary.concerning_trends)} پارامتر",
            clinician_explanation=(
                f"تحلیل روند بیمار {patient.full_name} نشان‌دهنده "
                f"بدتر شدن تدریجی در: {', '.join(concerning_names)} است. "
                f"بررسی دوره‌ای وضعیت بیمار توصیه می‌شود."
            ),
            evidence={
                "concerning_parameters": [
                    {
                        "name": t.test_name_fa,
                        "direction": t.direction,
                        "slope": t.slope,
                    }
                    for t in summary.concerning_trends
                ],
                "analysis_date": summary.analyzed_at.isoformat(),
            },
            recommendation_draft=(
                f"📋 بدتر شدن تدریجی — {patient.full_name}\n\n"
                f"پارامترهای نگران‌کننده:\n"
                + "\n".join(
                    f"• {t.test_name_fa}: {t.interpretation_fa}"
                    for t in summary.concerning_trends
                )
                + "\n\nپیشنهاد: بررسی دوره‌ای و مداخله زودهنگام"
            ),
        )

        alert = alert_service.create_alert_from_rule(
            db=db,
            patient_id=patient.id,
            rule_result=rule_result,
        )

        if alert:
            stats["trend_alerts"] += 1

    except Exception as exc:
        logger.warning(
            f"خطا در trend analysis بیمار {patient.id}: {exc}"
        )


def _check_overdue_labs(db: Session, patient, stats: dict) -> None:
    """بررسی آزمایش‌های سررسیدشده"""
    from app.models.lab_result import LabPanel, LabResult
    from app.services.alert_service import alert_service
    from app.analysis.rules.base import RuleResult
    from app.shared.enums import AlertCategory, AlertSeverity

    # آزمایش‌های ماهانه
    MONTHLY_TESTS = ["K", "Na", "Ca", "P", "Hb", "Hct", "Alb", "BUN", "Cr", "CRP"]
    QUARTERLY_TESTS = ["PTH", "Ferritin", "TSAT"]

    thirty_days_ago = date.today() - timedelta(days=30)
    ninety_days_ago = date.today() - timedelta(days=90)

    overdue = []

    for test_code in MONTHLY_TESTS:
        last = (
            db.query(LabResult)
            .join(LabPanel)
            .filter(
                LabResult.patient_id == patient.id,
                LabResult.test_code == test_code,
                LabPanel.collected_at >= thirty_days_ago,
            )
            .first()
        )
        if not last:
            overdue.append({"test": test_code, "frequency": "ماهانه"})

    for test_code in QUARTERLY_TESTS:
        last = (
            db.query(LabResult)
            .join(LabPanel)
            .filter(
                LabResult.patient_id == patient.id,
                LabResult.test_code == test_code,
                LabPanel.collected_at >= ninety_days_ago,
            )
            .first()
        )
        if not last:
            overdue.append({"test": test_code, "frequency": "سه‌ماهه"})

    if not overdue:
        return

    overdue_names = [f"{o['test']} ({o['frequency']})" for o in overdue[:5]]

    rule_result = RuleResult(
        triggered=True,
        category=AlertCategory.LAB,
        rule_name="OVERDUE_LAB_TESTS",
        severity=AlertSeverity.LOW,
        title=f"آزمایش‌های سررسیدشده: {', '.join([o['test'] for o in overdue[:3]])}",
        clinician_explanation=(
            f"آزمایش‌های زیر برای {patient.full_name} "
            f"در بازه توصیه‌شده ثبت نشده‌اند: "
            f"{', '.join(overdue_names)}"
        ),
        evidence={
            "overdue_tests": overdue,
            "check_date": str(date.today()),
        },
    )

    alert = alert_service.create_alert_from_rule(
        db=db,
        patient_id=patient.id,
        rule_result=rule_result,
        auto_create_recommendation=False,
    )

    if alert:
        stats["overdue_lab_alerts"] += 1


# ============================================================
# CRON: بررسی آزمایش‌های عقب‌افتاده
# ============================================================

@celery_app.task(
    name="app.tasks.analysis_tasks.check_overdue_labs",
    queue="maintenance",
)
def check_overdue_labs() -> dict:
    """
    بررسی هفتگی آزمایش‌های سررسیدشده

    جداگانه از daily_review برای اجرای هفتگی
    """
    db = _get_db()
    try:
        from app.models.patient import Patient

        patients = db.query(Patient).filter(
            Patient.is_active == True
        ).all()

        stats = {"total": len(patients), "overdue_alerts": 0}

        for patient in patients:
            try:
                _check_overdue_labs(db, patient, stats)
            except Exception as exc:
                logger.error(
                    f"خطا در بررسی آزمایش بیمار {patient.id}: {exc}"
                )

        return stats

    finally:
        db.close()