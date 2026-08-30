"""
سرویس احراز هویت
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

import redis
from sqlalchemy.orm import Session

from app.config.settings import get_settings
from app.infrastructure.security.jwt import (
    create_access_token,
    create_refresh_token,
    create_token_pair,
    decode_token,
    get_jti_from_token,
    TokenPair,
)
from app.infrastructure.security.password import (
    hash_password,
    verify_password,
    validate_password_strength,
)
from app.infrastructure.auditing.logger import audit_logger
from app.models.user import User
from app.shared.enums import UserRole
from app.exceptions.business_exceptions import (
    InvalidCredentialsException,
    InactiveUserException,
    TokenBlacklistedException,
    WeakPasswordException,
    InvalidPasswordException,
)

settings = get_settings()

# اتصال به Redis برای blacklist توکن‌ها
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

# پیشوند کلید در Redis
TOKEN_BLACKLIST_PREFIX = "token_blacklist:"
LOGIN_ATTEMPTS_PREFIX = "login_attempts:"


class AuthService:

    def authenticate_user(
        self,
        db: Session,
        phone_number: str,
        password: str,
    ) -> User:
        """
        احراز هویت کاربر با شماره موبایل و رمز عبور

        Args:
            db: session دیتابیس
            phone_number: شماره موبایل
            password: رمز عبور

        Returns:
            User object

        Raises:
            InvalidCredentialsException: اگر اطلاعات نادرست باشد
            InactiveUserException: اگر حساب غیرفعال باشد
        """
        user = db.query(User).filter(
            User.phone_number == phone_number
        ).first()

        if not user:
            raise InvalidCredentialsException(
                "شماره موبایل یا رمز عبور اشتباه است"
            )

        if not verify_password(password, user.hashed_password):
            raise InvalidCredentialsException(
                "شماره موبایل یا رمز عبور اشتباه است"
            )

        if not user.is_active:
            raise InactiveUserException(
                "حساب کاربری شما غیرفعال است. با پشتیبانی تماس بگیرید."
            )

        # به‌روز کردن last_login
        user.last_login = datetime.now(timezone.utc)
        db.commit()

        return user

    def create_tokens(self, user: User) -> TokenPair:
        """ایجاد جفت توکن برای کاربر"""
        return create_token_pair(str(user.id), user.role)

    def refresh_access_token(self, refresh_token: str) -> tuple[str, int]:
        """
        ایجاد access token جدید با refresh token

        Returns:
            (new_access_token, expires_in_seconds)

        Raises:
            InvalidCredentialsException: اگر refresh token نامعتبر باشد
            TokenBlacklistedException: اگر blacklist شده باشد
        """
        try:
            payload = decode_token(refresh_token)
        except Exception:
            raise InvalidCredentialsException("توکن نامعتبر است")

        if payload.type != "refresh":
            raise InvalidCredentialsException("نوع توکن اشتباه است")

        if self.is_token_blacklisted(payload.jti):
            raise TokenBlacklistedException("این توکن باطل شده است")

        from app.shared.enums import UserRole
        role = UserRole(payload.role)
        access_token, _ = create_access_token(payload.sub, role)

        return access_token, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    def invalidate_token(self, jti: str, expire_seconds: int = None) -> None:
        """
        Blacklist کردن یک توکن در Redis

        Args:
            jti: شناسه یکتای توکن
            expire_seconds: مدت نگهداری در blacklist
        """
        if expire_seconds is None:
            expire_seconds = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600

        key = f"{TOKEN_BLACKLIST_PREFIX}{jti}"
        redis_client.setex(key, expire_seconds, "1")

    def invalidate_tokens(self, access_token: str, refresh_token: str = None) -> None:
        """Blacklist کردن access و refresh token"""
        access_jti = get_jti_from_token(access_token)
        if access_jti:
            self.invalidate_token(
                access_jti,
                settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            )

        if refresh_token:
            refresh_jti = get_jti_from_token(refresh_token)
            if refresh_jti:
                self.invalidate_token(
                    refresh_jti,
                    settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
                )

    def is_token_blacklisted(self, jti: str) -> bool:
        """بررسی اینکه آیا توکن blacklist شده"""
        key = f"{TOKEN_BLACKLIST_PREFIX}{jti}"
        return redis_client.exists(key) > 0

    def check_rate_limit(self, phone_number: str) -> tuple[bool, int]:
        """
        بررسی rate limit ورود

        Returns:
            (is_allowed, remaining_attempts)
        """
        key = f"{LOGIN_ATTEMPTS_PREFIX}{phone_number}"
        attempts = redis_client.get(key)

        max_attempts = settings.LOGIN_RATE_LIMIT
        current = int(attempts) if attempts else 0

        if current >= max_attempts:
            ttl = redis_client.ttl(key)
            return False, ttl

        return True, max_attempts - current - 1

    def increment_login_attempts(self, phone_number: str) -> None:
        """افزایش شمارنده تلاش‌های ناموفق ورود"""
        key = f"{LOGIN_ATTEMPTS_PREFIX}{phone_number}"
        pipe = redis_client.pipeline()
        pipe.incr(key)
        pipe.expire(key, 600)  # ۱۰ دقیقه
        pipe.execute()

    def reset_login_attempts(self, phone_number: str) -> None:
        """پاک کردن شمارنده تلاش‌های ناموفق"""
        key = f"{LOGIN_ATTEMPTS_PREFIX}{phone_number}"
        redis_client.delete(key)

    def change_password(
        self,
        db: Session,
        user: User,
        old_password: str,
        new_password: str,
    ) -> None:
        """
        تغییر رمز عبور

        Raises:
            InvalidPasswordException: اگر رمز قدیمی اشتباه باشد
            WeakPasswordException: اگر رمز جدید ضعیف باشد
        """
        if not verify_password(old_password, user.hashed_password):
            raise InvalidPasswordException("رمز عبور فعلی اشتباه است")

        is_strong, errors = validate_password_strength(new_password)
        if not is_strong:
            raise WeakPasswordException(
                "رمز عبور جدید کافی قوی نیست",
                details={"errors": errors},
            )

        user.hashed_password = hash_password(new_password)
        db.commit()


# Singleton
auth_service = AuthService()