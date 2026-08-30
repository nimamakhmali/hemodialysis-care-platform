"""
ایجاد کاربر ادمین از طریق CLI
"""

import sys
import os
import getpass

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config.database import SessionLocal
from app.models.user import User
from app.shared.enums import UserRole
from app.shared.utils import is_valid_iranian_phone, normalize_phone


def create_admin():
    print("=" * 50)
    print("👤 ایجاد کاربر ادمین جدید")
    print("=" * 50)

    phone = input("شماره موبایل (مثال: 09123456789): ").strip()
    phone = normalize_phone(phone)

    if not is_valid_iranian_phone(phone):
        print("❌ فرمت شماره موبایل نامعتبر است")
        sys.exit(1)

    full_name = input("نام و نام خانوادگی: ").strip()
    if not full_name:
        print("❌ نام نمی‌تواند خالی باشد")
        sys.exit(1)

    password = getpass.getpass("رمز عبور: ")
    password_confirm = getpass.getpass("تکرار رمز عبور: ")

    if password != password_confirm:
        print("❌ رمزهای عبور یکسان نیستند")
        sys.exit(1)

    if len(password) < 8:
        print("❌ رمز عبور باید حداقل ۸ کاراکتر باشد")
        sys.exit(1)

    from app.infrastructure.security.password import hash_password

    db = SessionLocal()
    try:
        existing = db.query(User).filter(
            User.phone_number == phone
        ).first()

        if existing:
            print(f"❌ کاربری با این شماره موبایل وجود دارد")
            sys.exit(1)

        admin = User(
            phone_number=phone,
            full_name=full_name,
            hashed_password=hash_password(password),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        db.commit()

        print(f"\n✅ ادمین با موفقیت ایجاد شد:")
        print(f"   شماره: {phone}")
        print(f"   نام: {full_name}")
        print(f"   نقش: {UserRole.ADMIN.value}")

    except Exception as e:
        print(f"❌ خطا: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()