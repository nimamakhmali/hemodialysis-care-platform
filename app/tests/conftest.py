"""
Fixtures مشترک تست‌ها
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config.database import Base, get_db
from app.infrastructure.security.password import hash_password
from app.main import app
from app.models.user import User
from app.models.patient import Patient
from app.shared.enums import UserRole, Gender, VascularAccessType

# دیتابیس in-memory برای تست
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """ایجاد جداول برای محیط تست"""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def db():
    """Session دیتابیس تست"""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db):
    """FastAPI TestClient"""
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_user(db) -> User:
    """کاربر ادمین برای تست"""
    user = User(
        phone_number="09100000001",
        full_name="ادمین تست",
        hashed_password=hash_password("Admin@123456"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def clinician_user(db) -> User:
    """کاربر کلینیسین برای تست"""
    user = User(
        phone_number="09100000002",
        full_name="دکتر تست",
        hashed_password=hash_password("Clinic@123456"),
        role=UserRole.CLINICIAN,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def patient_user(db) -> User:
    """کاربر بیمار برای تست"""
    user = User(
        phone_number="09100000003",
        full_name="بیمار تست",
        hashed_password=hash_password("Patient@123456"),
        role=UserRole.PATIENT,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def sample_patient(db, clinician_user) -> Patient:
    """بیمار نمونه برای تست"""
    patient = Patient(
        medical_record_number="MRN-TEST-001",
        full_name="علی محمدی",
        dry_weight=70.0,
        dialysis_frequency_per_week=3,
        vascular_access_type=VascularAccessType.FISTULA,
        assigned_clinician_id=clinician_user.id,
        is_active=True,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@pytest.fixture()
def clinician_token(client, clinician_user) -> str:
    """توکن کلینیسین برای تست"""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "phone_number": "09100000002",
            "password": "Clinic@123456",
        },
    )
    return response.json()["data"]["access_token"]


@pytest.fixture()
def patient_token(client, patient_user) -> str:
    """توکن بیمار برای تست"""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "phone_number": "09100000003",
            "password": "Patient@123456",
        },
    )
    return response.json()["data"]["access_token"]


@pytest.fixture()
def admin_token(client, admin_user) -> str:
    """توکن ادمین برای تست"""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "phone_number": "09100000001",
            "password": "Admin@123456",
        },
    )
    return response.json()["data"]["access_token"]