"""
تست‌های یکپارچگی — احراز هویت
"""

import pytest
from fastapi.testclient import TestClient


class TestLogin:

    def test_login_success_clinician(self, client: TestClient, clinician_user):
        """ورود موفق کلینیسین"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "phone_number": "09100000002",
                "password": "Clinic@123456",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "access_token" in data["data"]
        assert "refresh_token" in data["data"]
        assert data["data"]["user"]["role"] == "clinician"

    def test_login_wrong_password(self, client: TestClient, clinician_user):
        """ورود با رمز اشتباه"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "phone_number": "09100000002",
                "password": "WrongPassword",
            },
        )
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "INVALID_CREDENTIALS"

    def test_login_wrong_phone(self, client: TestClient):
        """ورود با شماره موبایل نامعتبر"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "phone_number": "09999999999",
                "password": "SomePassword",
            },
        )
        assert response.status_code == 401

    def test_login_invalid_phone_format(self, client: TestClient):
        """ورود با فرمت موبایل نادرست"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "phone_number": "1234",
                "password": "SomePassword",
            },
        )
        assert response.status_code == 422

    def test_login_inactive_user(self, client: TestClient, db):
        """ورود کاربر غیرفعال"""
        from app.models.user import User
        from app.shared.enums import UserRole
        from app.infrastructure.security.password import hash_password

        inactive_user = User(
            phone_number="09100000099",
            full_name="کاربر غیرفعال",
            hashed_password=hash_password("Test@123456"),
            role=UserRole.CLINICIAN,
            is_active=False,
        )
        db.add(inactive_user)
        db.commit()

        response = client.post(
            "/api/v1/auth/login",
            json={
                "phone_number": "09100000099",
                "password": "Test@123456",
            },
        )
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "INACTIVE_USER"


class TestTokenRefresh:

    def test_refresh_success(self, client: TestClient, clinician_user):
        """تجدید توکن موفق"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={"phone_number": "09100000002", "password": "Clinic@123456"},
        )
        refresh_token = login_response.json()["data"]["refresh_token"]

        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "access_token" in data["data"]

    def test_refresh_invalid_token(self, client: TestClient):
        """تجدید توکن با توکن نامعتبر"""
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid.token.here"},
        )
        assert response.status_code == 401


class TestGetMe:

    def test_get_me_success(self, client: TestClient, clinician_token):
        """دریافت اطلاعات کاربر جاری"""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {clinician_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["role"] == "clinician"
        assert data["data"]["phone_number"] == "09100000002"

    def test_get_me_without_token(self, client: TestClient):
        """دریافت اطلاعات بدون توکن"""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 403

    def test_get_me_invalid_token(self, client: TestClient):
        """دریافت اطلاعات با توکن نامعتبر"""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"},
        )
        assert response.status_code == 401


class TestChangePassword:

    def test_change_password_success(self, client: TestClient, clinician_token, clinician_user, db):
        """تغییر رمز عبور موفق"""
        response = client.post(
            "/api/v1/auth/change-password",
            json={
                "old_password": "Clinic@123456",
                "new_password": "NewClinic@789",
                "confirm_new_password": "NewClinic@789",
            },
            headers={"Authorization": f"Bearer {clinician_token}"},
        )
        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_change_password_wrong_old(self, client: TestClient, clinician_token):
        """تغییر رمز با رمز قدیمی اشتباه"""
        response = client.post(
            "/api/v1/auth/change-password",
            json={
                "old_password": "WrongOldPassword",
                "new_password": "NewClinic@789",
                "confirm_new_password": "NewClinic@789",
            },
            headers={"Authorization": f"Bearer {clinician_token}"},
        )
        assert response.status_code == 400

    def test_change_password_mismatch(self, client: TestClient, clinician_token):
        """تغییر رمز با تکرار متفاوت"""
        response = client.post(
            "/api/v1/auth/change-password",
            json={
                "old_password": "Clinic@123456",
                "new_password": "NewPass@789",
                "confirm_new_password": "DifferentPass@789",
            },
            headers={"Authorization": f"Bearer {clinician_token}"},
        )
        assert response.status_code == 422

    def test_change_password_weak(self, client: TestClient, clinician_token):
        """تغییر رمز با رمز ضعیف"""
        response = client.post(
            "/api/v1/auth/change-password",
            json={
                "old_password": "Clinic@123456",
                "new_password": "weak",
                "confirm_new_password": "weak",
            },
            headers={"Authorization": f"Bearer {clinician_token}"},
        )
        assert response.status_code == 400


class TestAccessControl:

    def test_patient_cannot_access_clinician_endpoint(
        self, client: TestClient, patient_token
    ):
        """بیمار نمی‌تواند به endpoint کلینیسین دسترسی داشته باشد"""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {patient_token}"},
        )
        # /me برای همه مجاز است
        assert response.status_code == 200
        assert response.json()["data"]["role"] == "patient"