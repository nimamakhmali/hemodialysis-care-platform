hemodialysis-backend/
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   │
│   ├── shared/                      # ✨ NEW
│   │   ├── __init__.py
│   │   ├── constants.py
│   │   ├── enums.py                 # AlertSeverity, UserRole, SymptomType, ...
│   │   └── utils.py
│   │
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── database.py
│   │   └── thresholds.py            # ✨ NEW: آستانه‌های پزشکی
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py
│   │   ├── responses.py
│   │   │
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py
│   │       │
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── auth.py
│   │           ├── patients.py
│   │           ├── dialysis_sessions.py
│   │           ├── lab_results.py
│   │           ├── symptom_reports.py
│   │           ├── fluid_logs.py
│   │           ├── diet_logs.py
│   │           ├── alerts.py
│   │           ├── recommendations.py
│   │           ├── messages.py
│   │           └── education.py
│   │
│   ├── models/                      # ✨ RENAMED (بهتر از core/models)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── patient.py
│   │   ├── dialysis_session.py
│   │   ├── lab_result.py
│   │   ├── symptom_report.py
│   │   ├── fluid_log.py
│   │   ├── diet_log.py
│   │   ├── alert.py
│   │   ├── recommendation.py
│   │   ├── patient_message.py
│   │   ├── education_content.py
│   │   └── audit_log.py
│   │
│   ├── schemas/                     # Request/Response DTOs
│   │   ├── __init__.py
│   │   ├── common.py                # BaseResponse, PaginatedResponse
│   │   ├── auth.py
│   │   ├── patient.py
│   │   ├── dialysis_session.py
│   │   ├── lab_result.py
│   │   ├── symptom_report.py
│   │   ├── fluid_log.py
│   │   ├── diet_log.py
│   │   ├── alert.py
│   │   ├── recommendation.py
│   │   ├── message.py
│   │   └── education.py
│   │
│   ├── services/                    # Business Logic
│   │   ├── __init__.py
│   │   ├── README.md                # ✨ NEW
│   │   ├── auth_service.py
│   │   ├── patient_service.py
│   │   ├── dialysis_service.py
│   │   ├── lab_service.py
│   │   ├── symptom_service.py
│   │   ├── alert_service.py
│   │   ├── recommendation_service.py
│   │   ├── message_service.py
│   │   └── education_service.py
│   │
│   ├── validators/                  # ✨ NEW
│   │   ├── __init__.py
│   │   ├── patient_validator.py
│   │   ├── dialysis_validator.py
│   │   ├── lab_validator.py
│   │   └── bp_validator.py          # مثلاً: systolic > diastolic
│   │
│   ├── analysis/                    # AI/Rules Engine
│   │   ├── __init__.py
│   │   ├── README.md                # ✨ NEW
│   │   ├── engine.py
│   │   ├── rules/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── bp_rules.py
│   │   │   ├── weight_rules.py
│   │   │   ├── lab_rules.py
│   │   │   └── symptom_rules.py
│   │   ├── trends.py
│   │   └── risk.py
│   │
│   ├── events/                      # Event Bus ساده
│   │   ├── __init__.py
│   │   ├── publisher.py
│   │   └── domain_events.py
│   │
│   ├── exceptions/
│   │   ├── __init__.py
│   │   ├── http_exceptions.py
│   │   └── business_exceptions.py
│   │
│   ├── infrastructure/
│   │   ├── __init__.py
│   │   │
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── session.py
│   │   │   └── base.py
│   │   │
│   │   ├── security/
│   │   │   ├── __init__.py
│   │   │   ├── jwt.py
│   │   │   ├── password.py
│   │   │   └── rbac.py
│   │   │
│   │   ├── auditing/
│   │   │   ├── __init__.py
│   │   │   └── logger.py
│   │   │
│   │   └── messaging/
│   │       ├── __init__.py
│   │       └── dispatcher.py
│   │
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── celery_app.py
│   │   ├── analysis_tasks.py
│   │   └── notification_tasks.py
│   │
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py
│       ├── unit/
│       │   ├── services/
│       │   ├── validators/
│       │   └── analysis/
│       ├── integration/
│       │   ├── api/
│       │   └── db/
│       └── fixtures/
│           ├── users.py
│           ├── patients.py
│           └── sessions.py
│
├── alembic/
├── scripts/
├── .env
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── README.md
└── pyproject.toml