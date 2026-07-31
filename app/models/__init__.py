"""
Import تمام مدل‌ها در یک‌جا برای Alembic autogenerate
"""

from app.models.user import User
from app.models.patient import Patient

__all__ = [
    "User",
    "Patient",
]