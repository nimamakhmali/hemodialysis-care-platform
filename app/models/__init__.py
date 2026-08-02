"""
Import تمام مدل‌ها در یک‌جا برای Alembic autogenerate
ترتیب import مهم است (foreign key dependencies)
"""

# پایه
from app.models.user import User
from app.models.patient import Patient

# جلسات و آزمایش‌ها
from app.models.dialysis_session import DialysisSession
from app.models.lab_result import LabReferenceRange, LabPanel, LabResult

# ورودی‌های بیمار
from app.models.symptom_report import SymptomReport
from app.models.fluid_log import FluidLog
from app.models.diet_log import DietLog

# خروجی‌های سیستم
from app.models.alert import Alert
from app.models.recommendation import Recommendation
from app.models.patient_message import PatientMessage
from app.models.education_content import EducationContent

# لاگ
from app.models.audit_log import AuditLog

__all__ = [
    "User",
    "Patient",
    "DialysisSession",
    "LabReferenceRange",
    "LabPanel",
    "LabResult",
    "SymptomReport",
    "FluidLog",
    "DietLog",
    "Alert",
    "Recommendation",
    "PatientMessage",
    "EducationContent",
    "AuditLog",
]