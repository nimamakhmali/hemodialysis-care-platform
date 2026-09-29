"""
مدیریت رمز عبور با bcrypt
"""

import re

import bcrypt

BCRYPT_ROUNDS = 12
BCRYPT_MAX_BYTES = 72


def _password_bytes(plain_password: str) -> bytes:
    encoded = plain_password.encode("utf-8")
    return encoded[:BCRYPT_MAX_BYTES]


def hash_password(plain_password: str) -> str:
    """
    Hash کردن رمز عبور با bcrypt

    Args:
        plain_password: رمز عبور متنی

    Returns:
        رمز عبور hash شده
    """
    return bcrypt.hashpw(
        _password_bytes(plain_password),
        bcrypt.gensalt(rounds=BCRYPT_ROUNDS),
    ).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    بررسی صحت رمز عبور

    Args:
        plain_password: رمز عبور وارد‌شده
        hashed_password: رمز عبور hash‌شده ذخیره‌شده

    Returns:
        True اگر رمز صحیح باشد
    """
    try:
        return bcrypt.checkpw(
            _password_bytes(plain_password),
            hashed_password.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


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
