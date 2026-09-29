"""
ایجاد کاربر از طریق CLI: ادمین، پزشک/پرستار، یا بیمار
"""

from __future__ import annotations

import getpass
import os
import sys
from datetime import date, datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session

from app.config.database import SessionLocal
from app.infrastructure.security.password import hash_password
from app.models.patient import Patient
from app.models.user import User
from app.shared.enums import Gender, UserRole, VascularAccessType
from app.shared.utils import is_valid_iranian_phone, normalize_phone

ROLE_LABELS = {
    UserRole.ADMIN: "ادمین",
    UserRole.CLINICIAN: "پزشک / پرستار",
    UserRole.PATIENT: "بیمار",
}

GENDER_CHOICES = {
    "1": Gender.MALE,
    "m": Gender.MALE,
    "male": Gender.MALE,
    "مرد": Gender.MALE,
    "2": Gender.FEMALE,
    "f": Gender.FEMALE,
    "female": Gender.FEMALE,
    "زن": Gender.FEMALE,
}

ACCESS_CHOICES = {
    "1": VascularAccessType.FISTULA,
    "fistula": VascularAccessType.FISTULA,
    "فیستول": VascularAccessType.FISTULA,
    "2": VascularAccessType.GRAFT,
    "graft": VascularAccessType.GRAFT,
    "گرافت": VascularAccessType.GRAFT,
    "3": VascularAccessType.CATHETER,
    "catheter": VascularAccessType.CATHETER,
    "کاتتر": VascularAccessType.CATHETER,
}


def _fail(message: str) -> None:
    print(f"❌ {message}")
    sys.exit(1)


def _prompt(label: str, required: bool = True) -> str:
    value = input(label).strip()
    if required and not value:
        _fail("این فیلد نمی‌تواند خالی باشد")
    return value


def _prompt_optional(label: str) -> str | None:
    value = input(label).strip()
    return value or None


def _prompt_phone() -> str:
    phone = normalize_phone(_prompt("شماره موبایل (مثال: 09123456789): "))
    if not is_valid_iranian_phone(phone):
        _fail("فرمت شماره موبایل نامعتبر است")
    return phone


def _prompt_password() -> str:
    password = getpass.getpass("رمز عبور: ")
    password_confirm = getpass.getpass("تکرار رمز عبور: ")
    if password != password_confirm:
        _fail("رمزهای عبور یکسان نیستند")
    if len(password) < 8:
        _fail("رمز عبور باید حداقل ۸ کاراکتر باشد")
    return password


def _prompt_role() -> UserRole:
    print("نقش کاربر:")
    print("  1) ادمین")
    print("  2) پزشک / پرستار")
    print("  3) بیمار")
    choice = _prompt("انتخاب (1/2/3): ").lower()
    mapping = {
        "1": UserRole.ADMIN,
        "admin": UserRole.ADMIN,
        "ادمین": UserRole.ADMIN,
        "2": UserRole.CLINICIAN,
        "clinician": UserRole.CLINICIAN,
        "doctor": UserRole.CLINICIAN,
        "پزشک": UserRole.CLINICIAN,
        "3": UserRole.PATIENT,
        "patient": UserRole.PATIENT,
        "بیمار": UserRole.PATIENT,
    }
    role = mapping.get(choice)
    if role is None:
        _fail("نقش نامعتبر است")
    return role


def _parse_date(value: str, field_name: str) -> date:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        _fail(f"{field_name} باید به صورت YYYY-MM-DD باشد")
        raise


def _prompt_gender() -> Gender | None:
    raw = _prompt_optional("جنسیت (1=مرد / 2=زن، خالی=رد شدن): ")
    if raw is None:
        return None
    gender = GENDER_CHOICES.get(raw.lower())
    if gender is None:
        _fail("جنسیت نامعتبر است")
    return gender


def _prompt_access_type() -> VascularAccessType | None:
    print("نوع دسترسی عروقی:")
    print("  1) فیستول")
    print("  2) گرافت")
    print("  3) کاتتر")
    raw = _prompt_optional("انتخاب (1/2/3، خالی=رد شدن): ")
    if raw is None:
        return None
    access = ACCESS_CHOICES.get(raw.lower())
    if access is None:
        _fail("نوع دسترسی عروقی نامعتبر است")
    return access


def _ensure_unique_phone(db: Session, phone: str) -> None:
    existing = db.query(User).filter(User.phone_number == phone).first()
    if existing:
        _fail("کاربری با این شماره موبایل وجود دارد")


def _create_account(
    db: Session,
    phone: str,
    full_name: str,
    password: str,
    role: UserRole,
) -> User:
    user = User(
        phone_number=phone,
        full_name=full_name,
        hashed_password=hash_password(password),
        role=role,
        is_active=True,
    )
    db.add(user)
    db.flush()
    return user


def _create_patient_profile(db: Session, user: User) -> Patient:
    mrn = _prompt("کد بیمارستانی / MRN: ")
    if len(mrn) < 3:
        _fail("کد بیمارستانی معتبر نیست")

    existing_mrn = db.query(Patient).filter(
        Patient.medical_record_number == mrn
    ).first()
    if existing_mrn:
        _fail("بیماری با این کد بیمارستانی وجود دارد")

    dob_raw = _prompt_optional("تاریخ تولد (YYYY-MM-DD، خالی=رد شدن): ")
    date_of_birth = _parse_date(dob_raw, "تاریخ تولد") if dob_raw else None
    gender = _prompt_gender()

    try:
        dry_weight = float(_prompt("وزن خشک (kg): "))
    except ValueError:
        _fail("وزن خشک باید عدد باشد")
    if dry_weight < 20 or dry_weight > 250:
        _fail("وزن خشک باید بین ۲۰ تا ۲۵۰ کیلوگرم باشد")

    access_type = _prompt_access_type()

    freq_raw = _prompt_optional("تعداد جلسات در هفته (پیش‌فرض ۳): ")
    if freq_raw:
        try:
            frequency = int(freq_raw)
        except ValueError:
            _fail("تعداد جلسات باید عدد باشد")
        if not (2 <= frequency <= 7):
            _fail("تعداد جلسات دیالیز باید بین ۲ تا ۷ در هفته باشد")
    else:
        frequency = 3

    start_raw = _prompt_optional("تاریخ شروع دیالیز (YYYY-MM-DD، خالی=رد شدن): ")
    dialysis_start_date = (
        _parse_date(start_raw, "تاریخ شروع دیالیز") if start_raw else None
    )

    clinician_phone = _prompt_optional(
        "شماره موبایل پزشک مسئول (خالی=بدون پزشک): "
    )
    assigned_clinician_id = None
    if clinician_phone:
        clinician_phone = normalize_phone(clinician_phone)
        clinician = db.query(User).filter(
            User.phone_number == clinician_phone,
            User.role == UserRole.CLINICIAN,
        ).first()
        if not clinician:
            _fail("پزشکی با این شماره موبایل یافت نشد")
        assigned_clinician_id = clinician.id

    patient = Patient(
        user_id=user.id,
        medical_record_number=mrn,
        full_name=user.full_name,
        date_of_birth=date_of_birth,
        gender=gender,
        phone_number=user.phone_number,
        dry_weight=dry_weight,
        vascular_access_type=access_type,
        dialysis_frequency_per_week=frequency,
        dialysis_start_date=dialysis_start_date,
        assigned_clinician_id=assigned_clinician_id,
        is_active=True,
    )
    db.add(patient)
    return patient


def create_user(role: UserRole | None = None) -> None:
    selected_role = role or _prompt_role()
    label = ROLE_LABELS[selected_role]

    print("=" * 50)
    print(f"👤 ایجاد کاربر {label}")
    print("=" * 50)

    phone = _prompt_phone()
    full_name = _prompt("نام و نام خانوادگی: ")
    password = _prompt_password()

    db = SessionLocal()
    try:
        _ensure_unique_phone(db, phone)
        user = _create_account(db, phone, full_name, password, selected_role)

        patient = None
        if selected_role == UserRole.PATIENT:
            patient = _create_patient_profile(db, user)

        db.commit()

        print(f"\n✅ کاربر {label} با موفقیت ایجاد شد:")
        print(f"   شماره: {phone}")
        print(f"   نام: {full_name}")
        print(f"   نقش: {selected_role.value}")
        if patient is not None:
            print(f"   MRN: {patient.medical_record_number}")
            print(f"   وزن خشک: {patient.dry_weight} kg")

    except SystemExit:
        db.rollback()
        raise
    except Exception as e:
        print(f"❌ خطا: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


def main() -> None:
    role_arg = sys.argv[1].strip().lower() if len(sys.argv) > 1 else None
    role_map = {
        "admin": UserRole.ADMIN,
        "clinician": UserRole.CLINICIAN,
        "doctor": UserRole.CLINICIAN,
        "patient": UserRole.PATIENT,
    }
    if role_arg and role_arg not in role_map:
        _fail("نقش باید یکی از admin / clinician / patient باشد")
    create_user(role_map.get(role_arg) if role_arg else None)


if __name__ == "__main__":
    main()
