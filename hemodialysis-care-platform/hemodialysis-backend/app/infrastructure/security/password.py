"""
مدیریت رمز عبور با bcrypt
"""

import re
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
)


def hash_password(plain_password: str) -> str:
    """
    Hash کردن رمز عبور با bcrypt

    Args:
        plain_password: رمز عبور متنی

    Returns:
        رمز عبور hash شده
    """
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    بررسی صحت رمز عبور

    Args:
        plain_password: رمز عبور وارد‌شده
        hashed_password: رمز عبور hash‌شده ذخیره‌شده

    Returns:
        True اگر رمز صحیح باشد
    """
    return pwd_context.verify(plain_password, hashed_password)


def validate_password_strength(password: str) -> tuple[bool, list[str]]:
    """
    بررسی قدرت رمز عبور

    قوانین:
    - حداقل ۸ کاراکتر
    - حداقل یک حرف بزرگ
    - حداقل یک حرف کوچک
    - حداقل یک عدد
    - حداقل یک کاراکتر خاص

    Returns:
        (is_valid, list_of_errors)
    """
    errors = []

    if len(password) < 8:
        errors.append("رمز عبور باید حداقل ۸ کاراکتر باشد")

    if not re.search(r'[A-Z]', password):
        errors.append("رمز عبور باید حداقل یک حرف بزرگ داشته باشد")

    if not re.search(r'[a-z]', password):
        errors.append("رمز عبور باید حداقل یک حرف کوچک داشته باشد")

    if not re.search(r'\d', password):
        errors.append("رمز عبور باید حداقل یک عدد داشته باشد")

    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-]', password):
        errors.append("رمز عبور باید حداقل یک کاراکتر خاص داشته باشد")

    return len(errors) == 0, errors