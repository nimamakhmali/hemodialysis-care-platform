"""
Seed کاربران نمونه برای اهداف آزمایشی (UI و سرور)

این اسکریپت ۴ کاربر ایجاد می‌کند:
  - ادمین       : 09100000000 / Test@123456
  - کلینیسین     : 09120000000 / Test@123456
  - بیمار ۱      : 09130000000 / Test@123456  (MRN: HEMO-0001)
  - بیمار ۲      : 09140000000 / Test@123456  (MRN: HEMO-0002)

نکته: از bcrypt مستقیم استفاده می‌شود چون نسخه passlib ناسازگار است.
اسکریپت idempotent است: در صورت وجود، حذف و دوباره ایجاد می‌کند.
"""
import sys
import os
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import bcrypt
from sqlalchemy.orm import Session

from app.config.database import SessionLocal, engine
from app.infrastructure.db.base import BaseModel
from app.models import User, Patient
from app.shared.enums import UserRole, Gender, VascularAccessType

TEST_PHONES = ["09100000000", "09120000000", "09130000000", "09140000000"]
TEST_MRNS = ["HEMO-0001", "HEMO-0002"]


def hash_pw(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()


TEST_PASSWORD = "Test@123456"
HASHED = hash_pw(TEST_PASSWORD)


def cleanup(db: Session) -> None:
    """حذف کاربران و بیماران نمونه پیشین برای idempotent بودن"""
    for phone in TEST_PHONES:
        user = db.query(User).filter(User.phone_number == phone).first()
        if user:
            db.query(Patient).filter(Patient.user_id == user.id).delete(synchronize_session=False)
            db.delete(user)
    for mrn in TEST_MRNS:
        p = db.query(Patient).filter(Patient.medical_record_number == mrn).first()
        if p:
            db.delete(p)
    db.commit()


def create_user(db: Session, phone: str, name: str, role: UserRole) -> User:
    user = User(
        phone_number=phone,
        full_name=name,
        hashed_password=HASHED,
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"  ✅ کاربر {role.value} ایجاد شد: {phone} / {name}")
    return user


def create_patient(
    db: Session,
    user: User,
    mrn: str,
    name: str,
    dob: date,
    gender: Gender,
    dry_weight: float,
    access_type: VascularAccessType,
    clinician: User | None = None,
) -> Patient:
    patient = Patient(
        user_id=user.id,
        medical_record_number=mrn,
        full_name=name,
        date_of_birth=dob,
        gender=gender,
        phone_number=user.phone_number,
        dry_weight=dry_weight,
        vascular_access_type=access_type,
        dialysis_frequency_per_week=3,
        dialysis_start_date=date(2024, 1, 1),
        comorbidities={"diabetes": True, "hypertension": True},
        assigned_clinician_id=clinician.id if clinician else None,
        is_active=True,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    print(f"  ✅ بیمار ایجاد شد: {mrn} / {name} (وزن خشک: {dry_weight} kg)")
    return patient


def main():
    print("=" * 60)
    print("🌱 Seed کاربران نمونه برای آزمایش")
    print("=" * 60)

    BaseModel.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("\n🧹 پاکسازی رکوردهای پیشین...")
        cleanup(db)

        print("\n👤 ایجاد ادمین...")
        admin = create_user(db, "09100000000", "ادمین سیستم", UserRole.ADMIN)

        print("\n👨‍⚕️ ایجاد کلینیسین...")
        clinician = create_user(db, "09120000000", "دکتر فاطمه کریمی", UserRole.CLINICIAN)

        print("\n🩺 ایجاد بیماران...")
        p1_user = create_user(db, "09130000000", "علی محمدی", UserRole.PATIENT)
        p1 = create_patient(
            db, p1_user, "HEMO-0001", "علی محمدی",
            date(1985, 3, 14), Gender.MALE, 72.0,
            VascularAccessType.FISTULA, clinician,
        )
        p2_user = create_user(db, "09140000000", "زهرا احمدی", UserRole.PATIENT)
        p2 = create_patient(
            db, p2_user, "HEMO-0002", "زهرا احمدی",
            date(1990, 7, 22), Gender.FEMALE, 58.0,
            VascularAccessType.CATHETER, clinician,
        )

        print("\n" + "=" * 60)
        print("✅ Seed کاربران با موفقیت انجام شد!")
        print("=" * 60)
        print("\n🔐 اطلاعات ورود برای آزمایش UI:")
        print(f"   ادمین     : {admin.phone_number}     / {TEST_PASSWORD}")
        print(f"   کلینیسین  : {clinician.phone_number}  / {TEST_PASSWORD}")
        print(f"   بیمار ۱   : {p1_user.phone_number} / {TEST_PASSWORD}  (MRN: HEMO-0001)")
        print(f"   بیمار ۲   : {p2_user.phone_number} / {TEST_PASSWORD}  (MRN: HEMO-0002)")

    except Exception as e:
        print(f"\n❌ خطا: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()