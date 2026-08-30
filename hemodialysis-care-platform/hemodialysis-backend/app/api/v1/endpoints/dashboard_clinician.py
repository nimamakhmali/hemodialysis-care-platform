# ============================================================
# app/api/v1/endpoints/dashboard_clinician.py
# ============================================================
"""
داشبورد کلینیسین

endpoint های مانیتورینگ و مدیریت برای پزشک/پرستار.
طراحی برای:
- نمای کلی سریع همه بیماران
- شناسایی بیماران urgent
- مدیریت هشدارها و توصیه‌ها
- پایش activity سیستم
"""

import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, desc, func, or_
from sqlalchemy.orm import Session, joinedload

from app.api.dependencies import get_db, require_clinician
from app.config.thresholds import WEIGHT_THRESHOLDS, BP_THRESHOLDS
from app.models.alert import Alert
from app.models.dialysis_session import DialysisSession
from app.models.lab_result import LabPanel, LabResult
from app.models.patient import Patient
from app.models.recommendation import Recommendation
from app.models.symptom_report import SymptomReport
from app.models.user import User
from app.services.alert_service import alert_service
from app.services.recommendation_service import recommendation_service
from app.shared.enums import AlertSeverity, AlertStatus, RecommendationStatus

router = APIRouter(prefix="/clinician", tags=["داشبورد کلینیسین"])


@router.get(
    "/dashboard",
    summary="داشبورد کلینیسین",
    description="نمای کلی سیستم برای کلینیسین با آمار، هشدارهای urgent و فعالیت اخیر.",
)
async def get_clinician_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
):
    """
    داشبورد اصلی کلینیسین

    همه داده‌ها با query بهینه لود می‌شوند.
    """
    # ============================================================
    # آمار کلی
    # ============================================================
    total_patients = (
        db.query(func.count(Patient.id))
        .filter(Patient.is_active == True)
        .scalar()
        or 0
    )

    # آمار هشدارها — یک query گروه‌بندی‌شده
    alert_stats = (
        db.query(
            Alert.severity,
            func.count(Alert.id).label("count"),
        )
        .filter(Alert.status == AlertStatus.NEW)
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
    pending_recs_count = (
        db.query(func.count(Recommendation.id))
        .filter(Recommendation.status == RecommendationStatus.DRAFT)
        .scalar()
        or 0
    )

    # بیمارانی که ۷+ روز داده ثبت نشده
    seven_days_ago = date.today() - timedelta(days=7)
    recent_patient_ids = (
        db.query(DialysisSession.patient_id)
        .filter(DialysisSession.session_date >= seven_days_ago)
        .distinct()
        .subquery()
    )

    no_recent_data_count = (
        db.query(func.count(Patient.id))
        .filter(
            Patient.is_active == True,
            ~Patient.id.in_(recent_patient_ids),
        )
        .scalar()
        or 0
    )

    # ============================================================
    # بیماران urgent (با HIGH alert)
    # ============================================================
    urgent_patient_data = _get_urgent_patients(db, limit=10)

    # ============================================================
    # توصیه‌های در انتظار (آخرین ۵)
    # ============================================================
    pending_recs = (
        db.query(Recommendation)
        .options(joinedload(Recommendation.patient))
        .filter(Recommendation.status == RecommendationStatus.DRAFT)
        .order_by(
            # HIGH اول، سپس قدیمی‌ترین
            case(
                (Recommendation.priority == AlertSeverity.HIGH, 0),
                (Recommendation.priority == AlertSeverity.MEDIUM, 1),
                else_=2,
            ),
            Recommendation.created_at.asc(),
        )
        .limit(5)
        .all()
    )

    # ============================================================
    # فعالیت اخیر سیستم
    # ============================================================
    recent_activity = _get_recent_activity(db, limit=15)

    return {
        "success": True,
        "data": {
            "stats": {
                "total_patients": total_patients,
                "active_alerts_high": alert_counts[AlertSeverity.HIGH],
                "active_alerts_medium": alert_counts[AlertSeverity.MEDIUM],
                "active_alerts_low": alert_counts[AlertSeverity.LOW],
                "total_active_alerts": sum(alert_counts.values()),
                "pending_recommendations": pending_recs_count,
                "patients_with_no_recent_data": no_recent_data_count,
                "generated_at": datetime.now(timezone.utc).isoformat(),
            },

            "urgent_patients": urgent_patient_data,

            "pending_recommendations": [
                {
                    "id": str(r.id),
                    "patient_id": str(r.patient_id),
                    "patient_name": r.patient.full_name if r.patient else None,
                    "priority": r.priority.value,
                    "priority_fa": _priority_fa(r.priority),
                    "draft_preview": r.draft_for_clinician[:200] + "..."
                    if len(r.draft_for_clinician) > 200
                    else r.draft_for_clinician,
                    "created_at": r.created_at.isoformat(),
                    "hours_pending": round(
                        (datetime.now(timezone.utc) - r.created_at).total_seconds()
                        / 3600,
                        1,
                    ),
                }
                for r in pending_recs
            ],

            "recent_activity": recent_activity,
        },
    }


@router.get(
    "/patients-overview",
    summary="نمای کلی همه بیماران",
    description=(
        "جدول بیماران با وضعیت بالینی. "
        "مرتب‌سازی پیش‌فرض: بیماران با بیشترین هشدار اول."
    ),
)
async def get_patients_overview(
    sort_by: str = Query(
        default="alert_count",
        description="معیار مرتب‌سازی: alert_count | risk_score | name | last_session",
    ),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    has_high_alert: Optional[bool] = Query(
        default=None,
        description="فقط بیمارانی که HIGH alert دارند",
    ),
    no_recent_data: Optional[bool] = Query(
        default=None,
        description="بیمارانی که ۷ روز است داده ثبت نشده",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
):
    """
    نمای جدولی بیماران با وضعیت بالینی

    بهینه‌سازی: با subquery های جداگانه برای آمار هر بیمار
    """
    # Subquery: هشدارهای فعال هر بیمار
    alert_subq = (
        db.query(
            Alert.patient_id,
            func.count(Alert.id).label("total_alerts"),
            func.sum(
                case((Alert.severity == AlertSeverity.HIGH, 1), else_=0)
            ).label("high_count"),
            func.sum(
                case((Alert.severity == AlertSeverity.MEDIUM, 1), else_=0)
            ).label("medium_count"),
            func.sum(
                case((Alert.severity == AlertSeverity.LOW, 1), else_=0)
            ).label("low_count"),
        )
        .filter(Alert.status == AlertStatus.NEW)
        .group_by(Alert.patient_id)
        .subquery()
    )

    # Subquery: آخرین جلسه هر بیمار
    session_subq = (
        db.query(
            DialysisSession.patient_id,
            func.max(DialysisSession.session_date).label("last_session_date"),
        )
        .group_by(DialysisSession.patient_id)
        .subquery()
    )

    # Subquery: آخرین آزمایش هر بیمار
    lab_subq = (
        db.query(
            LabPanel.patient_id,
            func.max(LabPanel.collected_at).label("last_lab_date"),
        )
        .group_by(LabPanel.patient_id)
        .subquery()
    )

    # Query اصلی
    query = (
        db.query(
            Patient,
            alert_subq.c.total_alerts,
            alert_subq.c.high_count,
            alert_subq.c.medium_count,
            alert_subq.c.low_count,
            session_subq.c.last_session_date,
            lab_subq.c.last_lab_date,
        )
        .outerjoin(alert_subq, Patient.id == alert_subq.c.patient_id)
        .outerjoin(session_subq, Patient.id == session_subq.c.patient_id)
        .outerjoin(lab_subq, Patient.id == lab_subq.c.patient_id)
        .filter(Patient.is_active == True)
    )

    # فیلترها
    if has_high_alert is True:
        query = query.filter(alert_subq.c.high_count > 0)

    if no_recent_data is True:
        seven_days_ago = date.today() - timedelta(days=7)
        query = query.filter(
            or_(
                session_subq.c.last_session_date < seven_days_ago,
                session_subq.c.last_session_date.is_(None),
            )
        )

    # مرتب‌سازی
    if sort_by == "alert_count":
        query = query.order_by(
            desc(func.coalesce(alert_subq.c.high_count, 0)),
            desc(func.coalesce(alert_subq.c.total_alerts, 0)),
        )
    elif sort_by == "name":
        query = query.order_by(Patient.full_name)
    elif sort_by == "last_session":
        query = query.order_by(desc(session_subq.c.last_session_date))
    else:
        query = query.order_by(
            desc(func.coalesce(alert_subq.c.high_count, 0))
        )

    total = query.count()
    rows = query.offset((page - 1) * size).limit(size).all()

    # ساخت response
    import math

    data = []
    for row in rows:
        (
            patient, total_alerts, high_count, medium_count,
            low_count, last_session_date, last_lab_date,
        ) = row

        total_alerts = total_alerts or 0
        high_count = high_count or 0
        medium_count = medium_count or 0
        low_count = low_count or 0

        # وضعیت وزن — نیاز به آخرین session دارد
        weight_status, bp_status = _get_weight_bp_status(
            db, patient.id, last_session_date
        )

        # روزهای بدون داده
        days_without_session = None
        if last_session_date:
            days_without_session = (date.today() - last_session_date).days

        data.append({
            "patient_id": str(patient.id),
            "medical_record_number": patient.medical_record_number,
            "full_name": patient.full_name,
            "age": patient.age,
            "dry_weight": patient.dry_weight,
            "vascular_access": patient.vascular_access_type.value
            if patient.vascular_access_type else None,

            "active_alerts": {
                "high": high_count,
                "medium": medium_count,
                "low": low_count,
                "total": total_alerts,
            },

            "last_session_date": str(last_session_date) if last_session_date else None,
            "days_without_session": days_without_session,
            "last_lab_date": str(last_lab_date) if last_lab_date else None,

            "weight_status": weight_status,
            "bp_status": bp_status,

            "needs_attention": high_count > 0 or days_without_session is None
            or days_without_session > 7,
        })

    return {
        "success": True,
        "data": data,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if size > 0 else 0,
        "filters_applied": {
            "has_high_alert": has_high_alert,
            "no_recent_data": no_recent_data,
            "sort_by": sort_by,
        },
    }


@router.get(
    "/alerts-feed",
    summary="جریان هشدارهای جدید",
    description="هشدارهای فعال با اطلاعات بیمار و امکانات مدیریت.",
)
async def get_alerts_feed(
    status: Optional[AlertStatus] = Query(None),
    severity: Optional[AlertSeverity] = Query(None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
):
    """
    جریان هشدارها با اطلاعات کامل بیمار

    مرتب‌سازی: HIGH اول، سپس جدیدترین
    """
    severity_case = case(
        (Alert.severity == AlertSeverity.HIGH, 0),
        (Alert.severity == AlertSeverity.MEDIUM, 1),
        else_=2,
    )

    query = (
        db.query(Alert)
        .options(joinedload(Alert.patient))
        .filter(Alert.status != AlertStatus.RESOLVED)
    )

    if status:
        query = query.filter(Alert.status == status)
    if severity:
        query = query.filter(Alert.severity == severity)

    total = query.count()

    alerts = (
        query
        .order_by(severity_case, desc(Alert.created_at))
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    import math

    return {
        "success": True,
        "data": [_alert_with_patient(a) for a in alerts],
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if size > 0 else 0,
        "summary": {
            "showing_status": status.value if status else "active",
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
    }


@router.get(
    "/patient/{patient_id}/clinical-summary",
    summary="خلاصه بالینی کامل یک بیمار برای کلینیسین",
    description="داشبورد تخصصی کلینیسین برای یک بیمار خاص.",
)
async def get_patient_clinical_summary(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
):
    """
    خلاصه بالینی کامل

    اطلاعات تخصصی‌تر از داشبورد بیمار:
    - روندهای بالینی با تفسیر
    - هشدارهای فعال با دلایل
    - توصیه‌های در انتظار
    - تاریخچه مختصر
    """
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.is_active == True,
    ).first()

    if not patient:
        from app.exceptions.business_exceptions import PatientNotFoundException
        raise PatientNotFoundException()

    # ۸ جلسه اخیر
    recent_sessions = (
        db.query(DialysisSession)
        .filter(DialysisSession.patient_id == patient_id)
        .order_by(desc(DialysisSession.session_date))
        .limit(8)
        .all()
    )

    # هشدارهای فعال
    active_alerts = (
        db.query(Alert)
        .filter(
            Alert.patient_id == patient_id,
            Alert.status == AlertStatus.NEW,
        )
        .order_by(
            case(
                (Alert.severity == AlertSeverity.HIGH, 0),
                (Alert.severity == AlertSeverity.MEDIUM, 1),
                else_=2,
            ),
            desc(Alert.created_at),
        )
        .all()
    )

    # توصیه‌های در انتظار
    pending_recs = (
        db.query(Recommendation)
        .filter(
            Recommendation.patient_id == patient_id,
            Recommendation.status == RecommendationStatus.DRAFT,
        )
        .order_by(desc(Recommendation.created_at))
        .all()
    )

    # آخرین آزمایش‌ها
    from itertools import groupby as _groupby

    all_labs = (
        db.query(LabResult, LabPanel.collected_at)
        .join(LabPanel, LabResult.panel_id == LabPanel.id)
        .filter(LabResult.patient_id == patient_id)
        .order_by(LabResult.test_code, desc(LabPanel.collected_at))
        .limit(100)
        .all()
    )

    latest_labs = {}
    for test_code, group in _groupby(all_labs, key=lambda x: x[0].test_code):
        first = next(iter(group))
        r, collected_at = first
        latest_labs[test_code] = {
            "value": r.value,
            "unit": r.unit,
            "date": str(collected_at),
            "is_abnormal": r.is_abnormal,
            "is_critical": r.is_critical,
            "direction": r.abnormality_direction,
        }

    # آخرین علائم
    recent_symptoms_db = (
        db.query(SymptomReport)
        .filter(SymptomReport.patient_id == patient_id)
        .order_by(desc(SymptomReport.reported_at))
        .limit(5)
        .all()
    )

    return {
        "success": True,
        "data": {
            "patient": {
                "id": str(patient.id),
                "full_name": patient.full_name,
                "medical_record_number": patient.medical_record_number,
                "age": patient.age,
                "dry_weight": patient.dry_weight,
                "dry_weight_updated_at": patient.dry_weight_updated_at.isoformat()
                if patient.dry_weight_updated_at else None,
                "vascular_access_type": patient.vascular_access_type.value
                if patient.vascular_access_type else None,
                "dialysis_frequency": patient.dialysis_frequency_per_week,
                "dialysis_start_date": str(patient.dialysis_start_date)
                if patient.dialysis_start_date else None,
                "comorbidities": patient.comorbidities,
                "clinical_notes": patient.clinical_notes,
            },

            "active_alerts": [
                {
                    "id": str(a.id),
                    "severity": a.severity.value,
                    "severity_fa": _severity_fa(a.severity),
                    "category": a.category.value,
                    "title": a.title,
                    "clinician_explanation": a.clinician_explanation,
                    "evidence": a.evidence,
                    "triggered_by_rule": a.triggered_by_rule,
                    "created_at": a.created_at.isoformat(),
                    "hours_old": round(
                        (datetime.now(timezone.utc) - a.created_at).total_seconds()
                        / 3600, 1
                    ),
                }
                for a in active_alerts
            ],

            "pending_recommendations": [
                {
                    "id": str(r.id),
                    "priority": r.priority.value,
                    "draft_for_clinician": r.draft_for_clinician,
                    "patient_content_draft": r.patient_content,
                    "created_at": r.created_at.isoformat(),
                }
                for r in pending_recs
            ],

            "recent_sessions": [
                {
                    "date": str(s.session_date),
                    "pre_weight": s.pre_weight,
                    "post_weight": s.post_weight,
                    "dry_weight": s.dry_weight_at_session,
                    "idwg_percent": s.weight_gain_percent,
                    "bp_pre": f"{s.bp_pre_systolic}/{s.bp_pre_diastolic}"
                    if s.has_bp_pre else None,
                    "bp_during": f"{s.bp_during_systolic}/{s.bp_during_diastolic}"
                    if s.bp_during_systolic else None,
                    "had_idh": s.had_intradialytic_hypotension,
                    "events": s.intradialytic_events or [],
                    "duration_min": s.duration_minutes,
                }
                for s in recent_sessions
            ],

            "latest_labs": latest_labs,

            "recent_symptoms": [
                {
                    "reported_at": r.reported_at.isoformat(),
                    "symptoms": r.symptoms,
                    "has_danger": r.has_danger_symptoms,
                    "notes": r.notes,
                }
                for r in recent_symptoms_db
            ],

            # آمار سریع
            "quick_stats": {
                "active_alert_count": len(active_alerts),
                "high_alert_count": sum(
                    1 for a in active_alerts
                    if a.severity == AlertSeverity.HIGH
                ),
                "pending_rec_count": len(pending_recs),
                "last_session_date": str(recent_sessions[0].session_date)
                if recent_sessions else None,
                "total_sessions": len(recent_sessions),
                "idh_rate": round(
                    sum(1 for s in recent_sessions if s.had_intradialytic_hypotension)
                    / len(recent_sessions) * 100, 1
                ) if recent_sessions else 0,
            },
        },
    }


# ============================================================
# Helper Functions
# ============================================================

def _get_urgent_patients(db: Session, limit: int = 10) -> list[dict]:
    """بیماران با HIGH alert — بهینه‌شده"""
    # بیماران با HIGH alert
    urgent_patient_ids = (
        db.query(Alert.patient_id, func.count(Alert.id).label("high_count"))
        .filter(
            Alert.severity == AlertSeverity.HIGH,
            Alert.status == AlertStatus.NEW,
        )
        .group_by(Alert.patient_id)
        .order_by(desc("high_count"))
        .limit(limit)
        .all()
    )

    if not urgent_patient_ids:
        return []

    patient_id_list = [row.patient_id for row in urgent_patient_ids]
    high_count_map = {row.patient_id: row.high_count for row in urgent_patient_ids}

    patients = (
        db.query(Patient)
        .filter(Patient.id.in_(patient_id_list))
        .all()
    )

    result = []
    for patient in patients:
        high_count = high_count_map.get(patient.id, 0)

        # آخرین جلسه
        last_session = (
            db.query(DialysisSession)
            .filter(DialysisSession.patient_id == patient.id)
            .order_by(desc(DialysisSession.session_date))
            .first()
        )

        result.append({
            "patient_id": str(patient.id),
            "full_name": patient.full_name,
            "medical_record_number": patient.medical_record_number,
            "high_alert_count": high_count,
            "dry_weight": patient.dry_weight,
            "last_session_date": str(last_session.session_date)
            if last_session else None,
            "last_idwg_percent": last_session.weight_gain_percent
            if last_session else None,
        })

    # مرتب بر اساس high_count
    result.sort(key=lambda x: x["high_alert_count"], reverse=True)
    return result


def _get_recent_activity(db: Session, limit: int = 15) -> list[dict]:
    """فعالیت‌های اخیر سیستم — ترکیب session/lab/symptom"""
    activities = []
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)

    # جلسات اخیر
    recent_sessions = (
        db.query(DialysisSession, Patient.full_name)
        .join(Patient, DialysisSession.patient_id == Patient.id)
        .filter(DialysisSession.created_at >= cutoff)
        .order_by(desc(DialysisSession.created_at))
        .limit(5)
        .all()
    )

    for session, patient_name in recent_sessions:
        activities.append({
            "type": "session",
            "type_fa": "جلسه دیالیز",
            "patient_id": str(session.patient_id),
            "patient_name": patient_name,
            "description": f"جلسه {session.session_date} — وزن: {session.pre_weight} kg",
            "timestamp": session.created_at.isoformat(),
        })

    # آزمایش‌های اخیر
    recent_panels = (
        db.query(LabPanel, Patient.full_name)
        .join(Patient, LabPanel.patient_id == Patient.id)
        .filter(LabPanel.created_at >= cutoff)
        .order_by(desc(LabPanel.created_at))
        .limit(5)
        .all()
    )

    for panel, patient_name in recent_panels:
        activities.append({
            "type": "lab",
            "type_fa": "آزمایش",
            "patient_id": str(panel.patient_id),
            "patient_name": patient_name,
            "description": f"آزمایش {panel.collected_at}",
            "timestamp": panel.created_at.isoformat(),
        })

    # علائم اخیر
    recent_symptoms = (
        db.query(SymptomReport, Patient.full_name)
        .join(Patient, SymptomReport.patient_id == Patient.id)
        .filter(SymptomReport.created_at >= cutoff)
        .order_by(desc(SymptomReport.created_at))
        .limit(5)
        .all()
    )

    for report, patient_name in recent_symptoms:
        activities.append({
            "type": "symptom",
            "type_fa": "گزارش علائم",
            "patient_id": str(report.patient_id),
            "patient_name": patient_name,
            "description": (
                f"{'⚠️ ' if report.has_danger_symptoms else ''}"
                f"{len(report.symptoms or [])} علامت گزارش شد"
            ),
            "timestamp": report.created_at.isoformat(),
            "has_danger": report.has_danger_symptoms,
        })

    # مرتب بر اساس timestamp
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    return activities[:limit]


def _get_weight_bp_status(
    db: Session,
    patient_id: uuid.UUID,
    last_session_date,
) -> tuple[str, str]:
    """وضعیت سریع وزن و BP — فقط آخرین جلسه"""
    if not last_session_date:
        return "unknown", "unknown"

    last_session = (
        db.query(DialysisSession)
        .filter(
            DialysisSession.patient_id == patient_id,
            DialysisSession.session_date == last_session_date,
        )
        .first()
    )

    if not last_session:
        return "unknown", "unknown"

    # وضعیت وزن
    idwg = last_session.weight_gain_percent
    if idwg is None:
        weight_status = "unknown"
    elif idwg >= WEIGHT_THRESHOLDS.idwg_percent_critical:
        weight_status = "critical"
    elif idwg >= WEIGHT_THRESHOLDS.idwg_percent_warning:
        weight_status = "warning"
    else:
        weight_status = "ok"

    # وضعیت BP
    sys = last_session.bp_pre_systolic
    if sys is None:
        bp_status = "unknown"
    elif sys >= BP_THRESHOLDS.pre_systolic_high_critical or sys <= BP_THRESHOLDS.pre_systolic_low_critical:
        bp_status = "critical"
    elif sys >= BP_THRESHOLDS.pre_systolic_high or sys <= BP_THRESHOLDS.pre_systolic_low:
        bp_status = "warning"
    else:
        bp_status = "ok"

    return weight_status, bp_status


def _alert_with_patient(alert: Alert) -> dict:
    SEVERITY_FA = {"low": "کم", "medium": "متوسط", "high": "زیاد"}
    CATEGORY_FA = {
        "weight": "وزن", "blood_pressure": "فشار خون",
        "lab": "آزمایش", "symptom": "علائم",
        "fluid": "مایعات", "diet": "رژیم",
    }

    return {
        "id": str(alert.id),
        "patient_id": str(alert.patient_id),
        "patient_name": alert.patient.full_name if alert.patient else None,
        "patient_mrn": alert.patient.medical_record_number
        if alert.patient else None,
        "severity": alert.severity.value,
        "severity_fa": SEVERITY_FA.get(alert.severity.value, ""),
        "category": alert.category.value,
        "category_fa": CATEGORY_FA.get(alert.category.value, ""),
        "title": alert.title,
        "clinician_explanation": alert.clinician_explanation,
        "evidence": alert.evidence,
        "triggered_by_rule": alert.triggered_by_rule,
        "status": alert.status.value,
        "created_at": alert.created_at.isoformat(),
        "hours_old": round(
            (datetime.now(timezone.utc) - alert.created_at).total_seconds()
            / 3600, 1
        ),
        "actions": {
            "can_acknowledge": alert.status == AlertStatus.NEW,
            "can_resolve": alert.status != AlertStatus.RESOLVED,
        },
    }


def _severity_fa(severity: AlertSeverity) -> str:
    return {"low": "کم", "medium": "متوسط", "high": "زیاد"}.get(
        severity.value, ""
    )


def _priority_fa(priority: AlertSeverity) -> str:
    return _severity_fa(priority)