"""
Role-Based Access Control (RBAC)

تعریف مجوزهای هر نقش در سیستم
"""

from app.shared.enums import UserRole

# ==========================================
# تعریف مجوزها
# ==========================================
PERMISSIONS: dict[str, list[str]] = {

    UserRole.ADMIN.value: [
        # ادمین به همه چیز دسترسی دارد
        "*",
    ],

    UserRole.CLINICIAN.value: [
        # بیمار
        "patient:read",
        "patient:create",
        "patient:update",
        "patient:deactivate",
        "patient:search",

        # جلسه دیالیز
        "session:create",
        "session:read",
        "session:update",

        # آزمایش
        "lab:create",
        "lab:read",

        # هشدار
        "alert:read",
        "alert:acknowledge",
        "alert:resolve",

        # توصیه
        "recommendation:read",
        "recommendation:approve",
        "recommendation:reject",

        # پیام
        "message:send",
        "message:read",

        # آموزش
        "education:read",

        # داشبورد
        "dashboard:clinician",
        "dashboard:patient",

        # لاگ
        "audit:read:own",
    ],

    UserRole.PATIENT.value: [
        # فقط به داده‌های خودش
        "patient:read:own",

        # ثبت علائم
        "symptom:create:own",
        "symptom:read:own",

        # ثبت مایعات
        "fluid:create:own",
        "fluid:read:own",

        # ثبت رژیم
        "diet:create:own",
        "diet:read:own",

        # دریافت پیام
        "message:read:own",
        "message:mark_read:own",

        # داشبورد
        "dashboard:patient:own",

        # آموزش
        "education:read",

        # هشدار فقط برای اطلاع
        "alert:read:own",
    ],
}


def has_permission(role: UserRole, permission: str) -> bool:
    """
    بررسی اینکه آیا یک نقش مجوز مشخصی دارد

    Args:
        role: نقش کاربر
        permission: مجوز مورد نظر

    Returns:
        True اگر مجوز داشته باشد
    """
    role_permissions = PERMISSIONS.get(role.value, [])

    # ادمین به همه چیز دسترسی دارد
    if "*" in role_permissions:
        return True

    # بررسی مجوز دقیق
    if permission in role_permissions:
        return True

    # بررسی مجوز wildcard
    # مثلاً "patient:read" شامل "patient:read:own" نمی‌شود
    # ولی اگر "patient:*" داشتیم، همه patient permissions را cover می‌کرد
    parts = permission.split(":")
    for i in range(len(parts) - 1, 0, -1):
        wildcard = ":".join(parts[:i]) + ":*"
        if wildcard in role_permissions:
            return True

    return False


def get_role_permissions(role: UserRole) -> list[str]:
    """دریافت لیست مجوزهای یک نقش"""
    return PERMISSIONS.get(role.value, [])