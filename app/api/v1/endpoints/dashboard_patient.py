# ============================================================
# app/api/v1/endpoints/dashboard_patient.py
# ============================================================
"""
داشبورد بیمار

یک endpoint اصلی که همه اطلاعات لازم برای صفحه اصلی
اپ بیمار را یکجا برمی‌گرداند (برای کاهش تعداد API call).

طراحی برای اپ موبایل:
- یک call برای همه داده‌های داشبورد
- یک call جداگانه برای داده‌های نمودار
- وضعیت‌ها به فارسی قابل نمایش مستقیم
"""

import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, get_patient_with_access
from app.config.thresholds import BP_THRESHOLDS, WEIGHT_THRESHOLDS
from app.models.alert import Alert
from app.models.dialysis_session import DialysisSession
from app.models.fluid_log import FluidLog
from app.models.lab_result import LabPanel, LabResult
from app.models.patient import Patient
from app.models.patient_message import PatientMessage
from app.models.user import User
from app.services.education_service import education_service
from app.services.message_service import message_service
from app.shared.enums import AlertStatus, LabTestCode
from app.shared.utils import calculate_slope

router = APIRouter(tags=["داشبورد بیمار"])

# آزمایش‌های کلیدی برای خلاصه داشبورد
KEY_LAB_TESTS = [
    LabTestCode.POTASSIUM.value,
    LabTestCode.HEMOGLOBIN.value,
    LabTestCode.PHOSPHORUS.value,
    LabTestCode.ALBUMIN.value,
    LabTestCode.CALCIUM.value,
    LabTestCode.SODIUM.value,
]


@router.get(
    "/patients/{patient_id}/dashboard",
    summary="داشبورد اصلی بیمار",
    description=(
        "همه اطلاعات لازم برای صفحه اصلی اپ بیمار را یکجا برمی‌گرداند. "
        "شامل خلاصه وضعیت وزن، فشار خون، آزمایش‌ها، پیام‌ها و آموزش‌ها."
    ),
)
async def get_patient_dashboard(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    patient: Patient = Depends(get_patient_with_access),
):
    """
    داشبورد کامل بیمار

    تمام داده‌ها با حداقل تعداد query لود می‌شوند.
    وضعیت‌ها به فارسی ساده برای نمایش مستقیم در اپ.
    """
    # ============================================================
    # Load همه داده‌ها
    # ============================================================

    # ۸ جلسه اخیر
    recent_sessions = (
        db.query(DialysisSession)
        .filter(DialysisSession.patient_id == patient_id)
        .order_by(desc(DialysisSession.session_date))
        .limit(8)
        .all()
    )

    last_session = recent_sessions[0] if recent_sessions else None

    # آخرین آزمایش‌های کلیدی — یک query
    from itertools import groupby as _groupby

    key_lab_results = (
        db.query(LabResult, LabPanel.collected_at)
        .join(LabPanel, LabResult.panel_id == LabPanel.id)
        .filter(
            LabResult.patient_id == patient_id,
            LabResult.test_code.in_(KEY_LAB_TESTS),
        )
        .order_by(LabResult.test_code, LabPanel.collected_at.desc())
        .limit(len(KEY_LAB_TESTS) * 3)
        .all()
    )

    latest_labs: dict[str, dict] = {}
    for test_code, group in _groupby(
        key_lab_results,
        key=lambda x: x[0].test_code,
    ):
        first = next(iter(group))
        result, collected_at = first
        latest_labs[test_code] = {
            "value": result.value,
            "unit": result.unit,
            "date": str(collected_at),
            "is_abnormal": result.is_abnormal,
            "is_critical": result.is_critical,
            "direction": result.abnormality_direction,
            "ref_low": result.ref_range_low,
            "ref_high": result.ref_range_high,
        }

    # هشدارهای فعال
    active_alerts_count = (
        db.query(func.count(Alert.id))
        .filter(
            Alert.patient_id == patient_id,
            Alert.status == AlertStatus.NEW,
        )
        .scalar()
        or 0
    )

    # پیام‌های اخیر
    recent_messages_db = (
        db.query(PatientMessage)
        .filter(PatientMessage.patient_id == patient_id)
        .order_by(desc(PatientMessage.sent_at))
        .limit(3)
        .all()
    )

    unread_count = message_service.get_unread_count(db, patient_id)

    # محتوای آموزشی مرتبط
    relevant_education = education_service.get_relevant_content(
        db=db,
        patient_id=patient_id,
        max_items=3,
    )

    # ============================================================
    # ساخت Response
    # ============================================================

    return {
        "success": True,
        "data": {
            # اطلاعات پایه بیمار
            "patient_info": _build_patient_info(patient),

            # خلاصه وزن
            "weight_summary": _build_weight_summary(
                patient, last_session, recent_sessions
            ),

            # خلاصه فشار خون
            "bp_summary": _build_bp_summary(last_session, recent_sessions),

            # خلاصه آزمایش‌ها
            "lab_summary": _build_lab_summary(latest_labs),

            # هشدارها
            "alerts": {
                "active_count": active_alerts_count,
                "has_urgent": active_alerts_count > 0,
                "message_fa": (
                    f"شما {active_alerts_count} هشدار فعال دارید"
                    if active_alerts_count > 0
                    else "هشداری ندارید"
                ),
            },

            # پیام‌ها
            "messages": {
                "recent": [_message_to_dict(m) for m in recent_messages_db],
                "unread_count": unread_count,
            },

            # آموزش‌های شخصی‌سازی‌شده
            "relevant_education": [
                {
                    "id": str(c.id),
                    "topic_code": c.topic_code,
                    "title_fa": c.title_fa,
                    "preview": c.content_fa[:150] + "..."
                    if len(c.content_fa) > 150
                    else c.content_fa,
                }
                for c in relevant_education
            ],

            # اطلاعات جلسه اخیر
            "last_session": _build_last_session_summary(last_session),

            # generated_at
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
    }


@router.get(
    "/patients/{patient_id}/trends",
    summary="داده‌های نمودار بیمار",
    description=(
        "داده‌های لازم برای رسم نمودارهای روند در اپ بیمار. "
        "شامل وزن، فشار خون و آزمایش‌های کلیدی."
    ),
)
async def get_patient_trends(
    patient_id: uuid.UUID,
    sessions_count: int = Query(
        default=8,
        ge=3,
        le=20,
        description="تعداد جلسات برای نمودار وزن و BP",
    ),
    lab_results_count: int = Query(
        default=6,
        ge=2,
        le=12,
        description="تعداد نتایج آزمایش برای نمودار",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    patient: Patient = Depends(get_patient_with_access),
):
    """
    داده‌های نمودار روند

    از قدیم به جدید مرتب می‌شود (برای رسم نمودار صحیح).
    """
    # ============================================================
    # داده‌های وزن و BP (جلسات)
    # ============================================================
    sessions = (
        db.query(DialysisSession)
        .filter(DialysisSession.patient_id == patient_id)
        .order_by(desc(DialysisSession.session_date))
        .limit(sessions_count)
        .all()
    )
    sessions_asc = list(reversed(sessions))  # قدیم به جدید

    # ============================================================
    # داده‌های آزمایشگاهی — یک query
    # ============================================================
    from itertools import groupby as _groupby

    all_lab_results = (
        db.query(LabResult, LabPanel.collected_at)
        .join(LabPanel, LabResult.panel_id == LabPanel.id)
        .filter(
            LabResult.patient_id == patient_id,
            LabResult.test_code.in_(KEY_LAB_TESTS),
        )
        .order_by(LabResult.test_code, LabPanel.collected_at.asc())  # قدیم به جدید
        .all()
    )

    # groupby test_code
    lab_charts: dict[str, list] = {code: [] for code in KEY_LAB_TESTS}

    for test_code, group in _groupby(
        all_lab_results,
        key=lambda x: x[0].test_code,
    ):
        group_list = list(group)
        # آخرین n نتیجه
        recent_group = group_list[-lab_results_count:]
        lab_charts[test_code] = [
            {
                "date": str(collected_at),
                "value": result.value,
                "is_abnormal": result.is_abnormal,
                "is_critical": result.is_critical,
            }
            for result, collected_at in recent_group
        ]

    # ref ranges برای نمودار
    from app.models.lab_result import LabReferenceRange

    ref_ranges_db = (
        db.query(LabReferenceRange)
        .filter(LabReferenceRange.test_code.in_(KEY_LAB_TESTS))
        .all()
    )
    ref_ranges = {r.test_code: r for r in ref_ranges_db}

    # ============================================================
    # ساخت Response
    # ============================================================
    return {
        "success": True,
        "data": {
            # نمودار وزن
            "weight_chart": [
                {
                    "date": str(s.session_date),
                    "pre_weight": s.pre_weight,
                    "post_weight": s.post_weight,
                    "dry_weight": s.dry_weight_at_session,
                    "weight_gain_kg": s.weight_gain,
                    "weight_gain_percent": s.weight_gain_percent,
                }
                for s in sessions_asc
            ],

            # نمودار فشار خون
            "bp_chart": [
                {
                    "date": str(s.session_date),
                    "pre_systolic": s.bp_pre_systolic,
                    "pre_diastolic": s.bp_pre_diastolic,
                    "during_systolic": s.bp_during_systolic,
                    "during_diastolic": s.bp_during_diastolic,
                    "post_systolic": s.bp_post_systolic,
                    "post_diastolic": s.bp_post_diastolic,
                    "had_idh": s.had_intradialytic_hypotension,
                }
                for s in sessions_asc
            ],

            # نمودارهای آزمایشگاهی
            "lab_charts": {
                test_code: {
                    "points": points,
                    "test_name_fa": _get_lab_name_fa(test_code),
                    "unit": _get_lab_unit(test_code),
                    "ref_low": ref_ranges[test_code].normal_low
                    if test_code in ref_ranges else None,
                    "ref_high": ref_ranges[test_code].normal_high
                    if test_code in ref_ranges else None,
                }
                for test_code, points in lab_charts.items()
                if points  # فقط آزمایش‌هایی که داده دارند
            },

            # خلاصه روندها
            "trend_summary": _build_trend_summary(
                sessions_asc, lab_charts
            ),
        },
    }


@router.get(
    "/patients/{patient_id}/health-status",
    summary="وضعیت کلی سلامت بیمار",
    description="نمای کلی وضعیت سلامت با امتیاز و توضیح فارسی.",
)
async def get_health_status(
    patient_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    patient: Patient = Depends(get_patient_with_access),
):
    """وضعیت کلی سلامت با توضیح ساده برای بیمار"""
    last_session = (
        db.query(DialysisSession)
        .filter(DialysisSession.patient_id == patient_id)
        .order_by(desc(DialysisSession.session_date))
        .first()
    )

    active_alerts = (
        db.query(Alert.severity, func.count(Alert.id).label("count"))
        .filter(
            Alert.patient_id == patient_id,
            Alert.status == AlertStatus.NEW,
        )
        .group_by(Alert.severity)
        .all()
    )

    from app.shared.enums import AlertSeverity

    alert_counts = {"high": 0, "medium": 0, "low": 0}
    for severity, count in active_alerts:
        alert_counts[severity.value] = count

    # تعیین وضعیت کلی
    if alert_counts["high"] > 0:
        overall_status = "critical"
        overall_message = "وضعیت شما نیاز به توجه فوری دارد. لطفاً با تیم درمان تماس بگیرید."
        overall_color = "red"
    elif alert_counts["medium"] > 0:
        overall_status = "warning"
        overall_message = "برخی پارامترهای سلامت شما نیاز به بررسی دارند."
        overall_color = "orange"
    else:
        overall_status = "good"
        overall_message = "وضعیت کلی شما در محدوده قابل قبول است."
        overall_color = "green"

    return {
        "success": True,
        "data": {
            "overall_status": overall_status,
            "overall_message": overall_message,
            "overall_color": overall_color,
            "alert_counts": alert_counts,
            "last_session_date": str(last_session.session_date)
            if last_session else None,
            "days_since_last_session": (
                (date.today() - last_session.session_date).days
                if last_session else None
            ),
        },
    }


# ============================================================
# Helper Functions
# ============================================================

def _build_patient_info(patient: Patient) -> dict:
    """اطلاعات پایه بیمار برای داشبورد"""
    from app.shared.enums import VascularAccessType

    access_fa = {
        "fistula": "فیستول",
        "graft": "گرافت",
        "catheter": "کاتتر",
    }

    return {
        "id": str(patient.id),
        "full_name": patient.full_name,
        "dry_weight": patient.dry_weight,
        "dry_weight_updated_at": (
            patient.dry_weight_updated_at.strftime("%Y-%m-%d")
            if patient.dry_weight_updated_at
            else None
        ),
        "vascular_access_fa": access_fa.get(
            patient.vascular_access_type.value
            if patient.vascular_access_type else "",
            ""
        ),
        "dialysis_frequency": patient.dialysis_frequency_per_week,
        "age": patient.age,
    }


def _build_weight_summary(
    patient: Patient,
    last_session: Optional[DialysisSession],
    recent_sessions: list[DialysisSession],
) -> dict:
    """خلاصه وضعیت وزن با ساده‌ترین زبان"""
    if not last_session:
        return {
            "available": False,
            "message_fa": "داده‌ای ثبت نشده است",
        }

    idwg = last_session.weight_gain_percent
    weight_gain = last_session.weight_gain

    # تعیین وضعیت
    if idwg is None:
        status = "unknown"
        status_fa = "نامشخص"
        status_color = "gray"
    elif idwg < WEIGHT_THRESHOLDS.idwg_percent_warning:
        status = "ok"
        status_fa = "مناسب"
        status_color = "green"
    elif idwg < WEIGHT_THRESHOLDS.idwg_percent_critical:
        status = "warning"
        status_fa = "بالاتر از حد توصیه‌شده"
        status_color = "orange"
    else:
        status = "critical"
        status_fa = "بحرانی"
        status_color = "red"

    # روند IDWG در جلسات اخیر
    idwg_values = [
        s.weight_gain_percent
        for s in reversed(recent_sessions)
        if s.weight_gain_percent is not None
    ]
    trend = _classify_trend(idwg_values) if len(idwg_values) >= 3 else "stable"

    return {
        "available": True,
        "last_session_date": str(last_session.session_date),
        "pre_weight": last_session.pre_weight,
        "post_weight": last_session.post_weight,
        "dry_weight": last_session.dry_weight_at_session,
        "weight_gain_kg": weight_gain,
        "idwg_percent": idwg,
        "status": status,
        "status_fa": status_fa,
        "status_color": status_color,
        "trend": trend,
        "trend_fa": _trend_fa(trend),
        "message_fa": _weight_message_fa(idwg, weight_gain),
    }


def _build_bp_summary(
    last_session: Optional[DialysisSession],
    recent_sessions: list[DialysisSession],
) -> dict:
    """خلاصه وضعیت فشار خون"""
    if not last_session or not last_session.has_bp_pre:
        return {
            "available": False,
            "message_fa": "داده‌ای ثبت نشده است",
        }

    sys = last_session.bp_pre_systolic
    dia = last_session.bp_pre_diastolic

    # وضعیت
    if sys >= BP_THRESHOLDS.pre_systolic_high_critical:
        status = "critical"
        status_fa = "بسیار بالا"
        status_color = "red"
    elif sys >= BP_THRESHOLDS.pre_systolic_high:
        status = "warning"
        status_fa = "بالا"
        status_color = "orange"
    elif sys <= BP_THRESHOLDS.pre_systolic_low_critical:
        status = "critical"
        status_fa = "بسیار پایین"
        status_color = "red"
    elif sys <= BP_THRESHOLDS.pre_systolic_low:
        status = "warning"
        status_fa = "پایین"
        status_color = "orange"
    else:
        status = "ok"
        status_fa = "مناسب"
        status_color = "green"

    # روند
    bp_values = [
        s.bp_pre_systolic
        for s in reversed(recent_sessions)
        if s.bp_pre_systolic is not None
    ]
    trend = _classify_trend([float(v) for v in bp_values]) if len(bp_values) >= 3 else "stable"

    # تعداد IDH در جلسات اخیر
    idh_count = sum(
        1 for s in recent_sessions[:5]
        if s.had_intradialytic_hypotension
    )

    return {
        "available": True,
        "last_session_date": str(last_session.session_date),
        "pre_systolic": sys,
        "pre_diastolic": dia,
        "pre_bp_display": f"{sys}/{dia} mmHg",
        "status": status,
        "status_fa": status_fa,
        "status_color": status_color,
        "trend": trend,
        "trend_fa": _trend_fa(trend),
        "had_idh_last_session": last_session.had_intradialytic_hypotension,
        "idh_count_last_5_sessions": idh_count,
        "message_fa": _bp_message_fa(sys, dia),
    }


def _build_lab_summary(latest_labs: dict) -> dict:
    """خلاصه آزمایش‌های کلیدی"""
    summary = {}

    lab_names_fa = {
        "K": "پتاسیم",
        "Hb": "هموگلوبین",
        "P": "فسفر",
        "Alb": "آلبومین",
        "Ca": "کلسیم",
        "Na": "سدیم",
    }

    for test_code in KEY_LAB_TESTS:
        lab = latest_labs.get(test_code)
        if not lab:
            continue

        # وضعیت
        if lab["is_critical"]:
            status = "critical"
            status_fa = "بحرانی"
            status_color = "red"
        elif lab["is_abnormal"]:
            direction = lab.get("direction", "")
            if direction == "high":
                status = "high"
                status_fa = "بالاتر از نرمال"
                status_color = "orange"
            else:
                status = "low"
                status_fa = "پایین‌تر از نرمال"
                status_color = "orange"
        else:
            status = "normal"
            status_fa = "نرمال"
            status_color = "green"

        # ref range display
        ref_text = None
        if lab.get("ref_low") and lab.get("ref_high"):
            ref_text = f"{lab['ref_low']} - {lab['ref_high']} {lab['unit']}"

        summary[test_code] = {
            "test_name_fa": lab_names_fa.get(test_code, test_code),
            "value": lab["value"],
            "unit": lab["unit"],
            "date": lab["date"],
            "status": status,
            "status_fa": status_fa,
            "status_color": status_color,
            "ref_range": ref_text,
            "display": f"{lab['value']} {lab['unit']}",
        }

    return summary


def _build_last_session_summary(
    last_session: Optional[DialysisSession],
) -> Optional[dict]:
    if not last_session:
        return None

    return {
        "date": str(last_session.session_date),
        "pre_weight": last_session.pre_weight,
        "post_weight": last_session.post_weight,
        "duration_minutes": last_session.duration_minutes,
        "had_complications": bool(last_session.intradialytic_events),
        "events_fa": _events_to_fa(last_session.intradialytic_events or []),
        "days_ago": (date.today() - last_session.session_date).days,
    }


def _build_trend_summary(
    sessions_asc: list,
    lab_charts: dict,
) -> dict:
    """خلاصه روندها برای نمایش متنی در اپ"""
    summary = {}

    # وزن
    idwg_values = [
        s.weight_gain_percent
        for s in sessions_asc
        if s.weight_gain_percent is not None
    ]
    if len(idwg_values) >= 3:
        trend = _classify_trend(idwg_values)
        summary["weight_trend"] = {
            "direction": trend,
            "direction_fa": _trend_fa(trend),
            "message_fa": _weight_trend_message(trend),
        }

    # BP
    bp_values = [
        float(s.bp_pre_systolic)
        for s in sessions_asc
        if s.bp_pre_systolic is not None
    ]
    if len(bp_values) >= 3:
        trend = _classify_trend(bp_values)
        summary["bp_trend"] = {
            "direction": trend,
            "direction_fa": _trend_fa(trend),
        }

    # آزمایش‌های کلیدی
    for test_code in ["K", "Hb", "P"]:
        points = lab_charts.get(test_code, [])
        if len(points) >= 3:
            values = [p["value"] for p in points]
            trend = _classify_trend(values)
            summary[f"{test_code}_trend"] = {
                "direction": trend,
                "direction_fa": _trend_fa(trend),
            }

    return summary


# ============================================================
# Pure Helper Functions
# ============================================================

def _classify_trend(values: list[float]) -> str:
    """طبقه‌بندی روند بر اساس slope"""
    if len(values) < 2:
        return "stable"
    slope = calculate_slope(values)
    if slope > 0.5:
        return "increasing"
    if slope < -0.5:
        return "decreasing"
    return "stable"


def _trend_fa(trend: str) -> str:
    return {
        "increasing": "صعودی",
        "decreasing": "نزولی",
        "stable": "پایدار",
    }.get(trend, "نامشخص")


def _weight_message_fa(
    idwg: Optional[float],
    gain_kg: Optional[float],
) -> str:
    if idwg is None:
        return "وزن ثبت نشده است"
    if idwg < 3:
        return f"افزایش وزن {gain_kg:.1f} کیلوگرم — در محدوده مناسب"
    if idwg < 5:
        return (
            f"افزایش وزن {gain_kg:.1f} کیلوگرم ({idwg:.1f}%) — "
            f"کمی بیشتر از حد توصیه‌شده. مراقب مصرف مایعات باشید."
        )
    return (
        f"افزایش وزن {gain_kg:.1f} کیلوگرم ({idwg:.1f}%) — "
        f"بیشتر از حد ایمن. لطفاً با تیم درمان مشورت کنید."
    )


def _bp_message_fa(sys: int, dia: int) -> str:
    if sys >= 180:
        return f"فشار خون {sys}/{dia} — بسیار بالا، با پزشک مشورت کنید"
    if sys >= 160:
        return f"فشار خون {sys}/{dia} — بالاتر از حد مطلوب"
    if sys <= 90:
        return f"فشار خون {sys}/{dia} — پایین، مراقب علائم باشید"
    return f"فشار خون {sys}/{dia} — در محدوده قابل قبول"


def _weight_trend_message(trend: str) -> str:
    return {
        "increasing": "افزایش وزن بین جلسات در حال بیشتر شدن است. مراقب مصرف مایعات باشید.",
        "decreasing": "روند افزایش وزن بهتر شده است.",
        "stable": "افزایش وزن بین جلسات ثابت است.",
    }.get(trend, "")


def _events_to_fa(events: list[str]) -> list[str]:
    fa_map = {
        "hypotension": "افت فشار خون",
        "muscle_cramp": "گرفتگی عضلات",
        "nausea_vomiting": "تهوع/استفراغ",
        "headache": "سردرد",
        "chest_pain": "درد قفسه سینه",
        "access_problem": "مشکل محل دسترسی",
        "other": "سایر",
    }
    return [fa_map.get(e, e) for e in events]


def _message_to_dict(msg: PatientMessage) -> dict:
    return {
        "id": str(msg.id),
        "title": msg.title,
        "preview": msg.content[:100] + "..." if len(msg.content) > 100 else msg.content,
        "sent_at": msg.sent_at.isoformat(),
        "is_read": msg.read_at is not None,
    }


def _get_lab_name_fa(test_code: str) -> str:
    names = {
        "K": "پتاسیم",
        "Na": "سدیم",
        "Ca": "کلسیم",
        "P": "فسفر",
        "Hb": "هموگلوبین",
        "Hct": "هماتوکریت",
        "Alb": "آلبومین",
        "CRP": "CRP",
        "Ferritin": "فریتین",
        "TSAT": "اشباع ترانسفرین",
        "PTH": "PTH",
        "Urea": "اوره",
        "Cr": "کراتینین",
    }
    return names.get(test_code, test_code)


def _get_lab_unit(test_code: str) -> str:
    from app.shared.constants import LAB_UNITS
    return LAB_UNITS.get(test_code, "")