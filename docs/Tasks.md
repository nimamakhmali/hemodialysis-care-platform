# تسک‌های پیاده‌سازی بک‌اند — سیستم همودیالیز

---

## 🗂️ فاز ۰ — پایه‌گذاری پروژه (Project Foundation)

---

### TASK-001 | راه‌اندازی پروژه و محیط توسعه

**هدف:** آماده‌سازی کامل محیط توسعه و ساختار پایه پروژه

**آنچه باید پیاده‌سازی شود:**

```
- ایجاد ساختار کامل دایرکتوری‌ها طبق معماری تعریف‌شده
- pyproject.toml با تمام dependencies اصلی:
    fastapi, uvicorn, sqlalchemy, alembic, 
    pydantic-settings, psycopg2-binary, python-jose,
    passlib, celery, redis, pandas, pytest
- .env.example با تمام متغیرهای محیطی لازم:
    DATABASE_URL, SECRET_KEY, ALGORITHM, 
    ACCESS_TOKEN_EXPIRE_MINUTES, REDIS_URL, ...
- docker-compose.yml شامل:
    - سرویس app (FastAPI)
    - سرویس db (PostgreSQL 15)
    - سرویس redis (Redis 7)
    - سرویس celery_worker
- Dockerfile برای اپلیکیشن
- .gitignore استاندارد Python
- README.md با راهنمای راه‌اندازی
- Makefile با دستورات رایج:
    make run, make migrate, make test, make lint
```

---

### TASK-002 | تنظیمات مرکزی و Config

**هدف:** یک منبع واحد برای تمام تنظیمات سیستم

**آنچه باید پیاده‌سازی شود:**

```
app/config/settings.py:
    - کلاس Settings با pydantic-settings
    - تنظیمات DB, JWT, App, Celery, Redis
    - محیط‌های مختلف: development / production / test
    - singleton instance: get_settings()

app/config/database.py:
    - engine با connection pooling مناسب
    - SessionLocal factory
    - Base declarative
    - get_db() dependency

app/config/thresholds.py:
    - تمام آستانه‌های پزشکی هاردکد:
        * BP_SYSTOLIC_HIGH / LOW
        * BP_DIASTOLIC_HIGH / LOW  
        * IDWG_WARNING_PERCENT (مثلاً 3% وزن خشک)
        * IDWG_CRITICAL_PERCENT (مثلاً 5%)
        * LAB_THRESHOLDS: {K: {low, high, critical_low, critical_high}, ...}
        * SESSION_DURATION_MIN / MAX
        * UF_RATE_MAX
    - ساختار: TypedDict یا dataclass برای type safety
    - کامنت‌گذاری دقیق برای هر آستانه (منبع پزشکی)
```

---

### TASK-003 | Enums و Constants مشترک

**هدف:** تعریف یکپارچه تمام مقادیر ثابت سیستم

**آنچه باید پیاده‌سازی شود:**

```
app/shared/enums.py:
    
    class UserRole(str, Enum):
        PATIENT = "patient"
        CLINICIAN = "clinician"    # پرستار یا پزشک ناظر
        ADMIN = "admin"
    
    class AlertSeverity(str, Enum):
        LOW = "low"
        MEDIUM = "medium"
        HIGH = "high"
    
    class AlertCategory(str, Enum):
        WEIGHT = "weight"
        BLOOD_PRESSURE = "blood_pressure"
        LAB = "lab"
        SYMPTOM = "symptom"
        FLUID = "fluid"
        DIET = "diet"
    
    class AlertStatus(str, Enum):
        NEW = "new"
        ACKNOWLEDGED = "acknowledged"
        RESOLVED = "resolved"
    
    class RecommendationStatus(str, Enum):
        DRAFT = "draft"
        APPROVED = "approved"
        EDITED = "edited"
        REJECTED = "rejected"
    
    class SymptomType(str, Enum):
        SHORTNESS_OF_BREATH = "shortness_of_breath"
        DIZZINESS = "dizziness"
        ACCESS_SITE_PAIN = "access_site_pain"
        MUSCLE_CRAMP = "muscle_cramp"
        NAUSEA = "nausea"
        ITCHING = "itching"
        HEADACHE = "headache"
        FATIGUE = "fatigue"
        CHEST_PAIN = "chest_pain"
        SWELLING = "swelling"
    
    class SymptomSeverity(str, Enum):
        MILD = "mild"
        MODERATE = "moderate"
        SEVERE = "severe"
    
    class SessionEvent(str, Enum):
        HYPOTENSION = "hypotension"
        MUSCLE_CRAMP = "muscle_cramp"
        NAUSEA_VOMITING = "nausea_vomiting"
        HEADACHE = "headache"
        CHEST_PAIN = "chest_pain"
        ACCESS_PROBLEM = "access_problem"
        OTHER = "other"
    
    class LabTestCode(str, Enum):
        # الکترولیت‌ها
        POTASSIUM = "K"
        SODIUM = "Na"
        CALCIUM = "Ca"
        PHOSPHORUS = "P"
        # خون
        HEMOGLOBIN = "Hb"
        HEMATOCRIT = "Hct"
        # التهاب و تغذیه
        ALBUMIN = "Alb"
        CRP = "CRP"
        # آهن
        FERRITIN = "Ferritin"
        TSAT = "TSAT"
        # هورمون
        PTH = "PTH"
        # کلیه
        UREA = "Urea"
        CREATININE = "Cr"
    
    class DietAdherence(str, Enum):
        GOOD = "good"
        MODERATE = "moderate"
        POOR = "poor"

app/shared/constants.py:
    - واحدهای آزمایش: LAB_UNITS = {K: "mEq/L", Hb: "g/dL", ...}
    - محدوده‌های منطقی ورود دستی: LAB_VALID_RANGE
    - BP_VALID_RANGE = {systolic: (60, 250), diastolic: (30, 150)}
    - WEIGHT_VALID_RANGE = (20, 250)  # kg
    - MAX_FLUID_INTAKE_ML = 5000
    - TREND_WINDOW_SESSIONS = 4  # تعداد جلسات برای تحلیل روند

app/shared/utils.py:
    - calculate_idwg(pre_weight, dry_weight) → float (kg و درصد)
    - calculate_bp_map(systolic, diastolic) → float (میانگین فشار شریانی)
    - get_persian_date() → str
    - paginate(query, page, size) → dict
    - format_trend_direction(slope) → str ("افزایشی"/"کاهشی"/"پایدار")
```

---

## 🗂️ فاز ۱ — لایه داده (Data Layer)

---

### TASK-004 | مدل‌های پایگاه داده — کاربران و بیماران

**هدف:** تعریف جداول اصلی کاربران و پروفایل بیماران

**آنچه باید پیاده‌سازی شود:**

```
app/infrastructure/db/base.py:
    - BaseModel با فیلدهای مشترک:
        * id: UUID (primary key)
        * created_at: datetime (server_default)
        * updated_at: datetime (onupdate)
    - نوع UUID برای تمام primary keyها

app/models/user.py — جدول: users
    فیلدها:
        id: UUID PK
        phone_number: str (unique, index) — احراز هویت با موبایل
        full_name: str
        role: UserRole (enum)
        is_active: bool (default True)
        hashed_password: str
        last_login: datetime (nullable)
        created_at / updated_at

app/models/patient.py — جدول: patients
    فیلدها:
        id: UUID PK
        user_id: FK → users (unique, nullable اگر بیمار لزوماً حساب کاربری ندارد)
        medical_record_number: str (unique) — کد بیمارستانی
        full_name: str
        date_of_birth: date
        gender: str (enum: male/female)
        phone_number: str
        
        # اطلاعات بالینی پایه
        dry_weight: float (kg) — وزن خشک هدف (تعیین‌شده توسط پزشک)
        dry_weight_updated_at: datetime
        vascular_access_type: str (fistula/graft/catheter)
        dialysis_frequency: int (جلسات در هفته — معمولاً ۳)
        dialysis_start_date: date
        
        # بیماری‌های همراه (JSON یا جداول جداگانه)
        comorbidities: JSON (nullable)
        
        # ارتباط با clinician
        assigned_clinician_id: FK → users (nullable)
        
        is_active: bool
        created_at / updated_at
    
    Index روی: medical_record_number, phone_number, assigned_clinician_id

    Relationship:
        user → User (one-to-one)
        dialysis_sessions → List[DialysisSession]
        lab_results → List[LabResult]
        symptom_reports → List[SymptomReport]
        alerts → List[Alert]
```

---

### TASK-005 | مدل‌های پایگاه داده — جلسات دیالیز

**هدف:** ثبت کامل اطلاعات هر جلسه دیالیز

**آنچه باید پیاده‌سازی شود:**

```
app/models/dialysis_session.py — جدول: dialysis_sessions
    فیلدها:
        id: UUID PK
        patient_id: FK → patients (index)
        session_date: date (index)
        session_start_time: time (nullable)
        session_end_time: time (nullable)
        duration_minutes: int (nullable)
        
        # وزن
        pre_weight: float (kg)
        post_weight: float (nullable)
        dry_weight_at_session: float — وزن خشک در زمان جلسه (snapshot)
        
        # محاسبه‌های خودکار (یا در service)
        weight_gain: float (nullable) — pre_weight - dry_weight
        uf_volume: float (nullable) — حجم آب خارج‌شده (لیتر)
        
        # فشار خون (سه نقطه اصلی)
        bp_pre_systolic: int (nullable)
        bp_pre_diastolic: int (nullable)
        bp_during_systolic: int (nullable)
        bp_during_diastolic: int (nullable)
        bp_post_systolic: int (nullable)
        bp_post_diastolic: int (nullable)
        
        # رخدادهای حین دیالیز
        intradialytic_events: ARRAY[SessionEvent] یا JSON
        
        # یادداشت
        notes: text (nullable)
        
        # ثبت‌کننده
        recorded_by: FK → users
        created_at / updated_at
    
    Constraints:
        CHECK: pre_weight > 0
        CHECK: duration_minutes BETWEEN 0 AND 600
        CHECK: bp_pre_systolic > bp_pre_diastolic (در validator)
    
    Index: (patient_id, session_date)
    Unique: (patient_id, session_date) — یک جلسه در روز
```

---

### TASK-006 | مدل‌های پایگاه داده — نتایج آزمایش

**هدف:** ذخیره‌سازی منعطف و استاندارد نتایج آزمایشگاهی

**آنچه باید پیاده‌سازی شود:**

```
app/models/lab_result.py — دو جدول:

جدول: lab_panels (پنل آزمایش — یک مجموعه در یک تاریخ)
    id: UUID PK
    patient_id: FK → patients
    collected_at: date — تاریخ نمونه‌گیری
    reported_at: date (nullable) — تاریخ جواب
    notes: text (nullable)
    recorded_by: FK → users
    created_at

جدول: lab_results (نتایج تکی)
    id: UUID PK
    panel_id: FK → lab_panels
    patient_id: FK → patients (برای query مستقیم)
    test_code: LabTestCode (enum, index)
    value: float
    unit: str — از LAB_UNITS constant
    
    # محدوده مرجع (در زمان ثبت snapshot بگیریم)
    ref_range_low: float (nullable)
    ref_range_high: float (nullable)
    
    # وضعیت نسبت به مرجع
    is_abnormal: bool (computed یا set در service)
    abnormality_direction: str (nullable) — "high"/"low"
    
    created_at
    
    Index: (patient_id, test_code, created_at)
    Unique: (panel_id, test_code) — هر تست یک بار در هر پنل

Reference table: lab_reference_ranges
    test_code: LabTestCode (PK)
    unit: str
    normal_low: float
    normal_high: float
    critical_low: float (nullable)
    critical_high: float (nullable)
    valid_min: float — محدوده منطقی ورود دستی
    valid_max: float
    description_fa: str — نام فارسی تست
```

---

### TASK-007 | مدل‌های پایگاه داده — ورودی‌های بیمار

**هدف:** ثبت علائم، مایعات و رژیم غذایی توسط بیمار

**آنچه باید پیاده‌سازی شود:**

```
app/models/symptom_report.py — جدول: symptom_reports
    id: UUID PK
    patient_id: FK → patients
    reported_at: datetime (index)
    
    # لیست علائم با شدت
    symptoms: JSON — [{type: SymptomType, severity: SymptomSeverity}]
    
    # یادداشت اختیاری
    notes: text (nullable)
    
    # لینک به جلسه (اختیاری)
    related_session_id: FK → dialysis_sessions (nullable)
    
    created_at

app/models/fluid_log.py — جدول: fluid_logs
    id: UUID PK
    patient_id: FK → patients
    log_date: date (index)
    
    # مجموع روزانه
    total_ml: int
    
    # جزئیات اختیاری (آیتم به آیتم)
    items: JSON (nullable)
    # مثال: [{type: "water", amount_ml: 200}, {type: "tea", amount_ml: 150}]
    
    notes: text (nullable)
    created_at / updated_at
    
    Unique: (patient_id, log_date)

app/models/diet_log.py — جدول: diet_logs
    id: UUID PK
    patient_id: FK → patients
    log_date: date (index)
    
    # سطح رعایت هر محدودیت
    potassium_adherence: DietAdherence
    phosphorus_adherence: DietAdherence
    protein_adherence: DietAdherence
    sodium_adherence: DietAdherence
    
    # یادداشت اختیاری
    notes: text (nullable)
    
    created_at / updated_at
    
    Unique: (patient_id, log_date)
```

---

### TASK-008 | مدل‌های پایگاه داده — خروجی‌های سیستم

**هدف:** ذخیره هشدارها، توصیه‌ها، پیام‌ها و محتوای آموزشی

**آنچه باید پیاده‌سازی شود:**

```
app/models/alert.py — جدول: alerts
    id: UUID PK
    patient_id: FK → patients (index)
    
    severity: AlertSeverity
    category: AlertCategory
    
    # عنوان و توضیح برای کادر درمان
    title: str
    clinician_explanation: text — چرا این هشدار؟
    evidence: JSON — داده‌هایی که هشدار از آن‌ها گرفته شده
    # مثال: {K_value: 6.2, K_date: "1403-01-01", threshold: 5.5}
    
    # قانونی که این هشدار را ایجاد کرده
    triggered_by_rule: str — نام rule (برای debug و audit)
    
    status: AlertStatus (default: NEW)
    acknowledged_by: FK → users (nullable)
    acknowledged_at: datetime (nullable)
    resolved_at: datetime (nullable)
    
    created_at

app/models/recommendation.py — جدول: recommendations
    id: UUID PK
    patient_id: FK → patients
    alert_id: FK → alerts (nullable) — اگر از alert آمده
    
    # پیش‌نویس برای پزشک
    draft_for_clinician: text — "مشاهدات: ... ریسک: ... پیشنهاد بررسی: ..."
    
    # نسخه قابل ارسال به بیمار (بعد از تأیید)
    patient_content: text (nullable)
    education_topic: str (nullable) — لینک به EducationContent
    
    status: RecommendationStatus (default: DRAFT)
    priority: AlertSeverity
    
    # چرخه تأیید
    reviewed_by: FK → users (nullable)
    reviewed_at: datetime (nullable)
    review_notes: text (nullable) — یادداشت پزشک هنگام ویرایش/رد
    
    created_at / updated_at

app/models/patient_message.py — جدول: patient_messages
    id: UUID PK
    patient_id: FK → patients
    recommendation_id: FK → recommendations (nullable)
    
    title: str
    content: text — متن نهایی تأییدشده
    
    sent_at: datetime
    sent_by: FK → users
    read_at: datetime (nullable)
    
    created_at

app/models/education_content.py — جدول: education_contents
    id: UUID PK
    topic_code: str (unique) — کد یکتا مثل "HIGH_K", "HIGH_IDWG"
    title_fa: str
    content_fa: text — متن آموزشی اصلی
    
    # برای شخصی‌سازی
    tags: ARRAY[str] — مثلاً ["potassium", "diet", "lab"]
    trigger_conditions: JSON — شرایطی که این محتوا نمایش داده می‌شود
    
    is_active: bool
    created_at / updated_at

app/models/audit_log.py — جدول: audit_logs
    id: UUID PK (یا bigint serial برای performance)
    
    user_id: FK → users (nullable — سیستم هم log می‌کند)
    action: str — "CREATE", "UPDATE", "DELETE", "LOGIN", "APPROVE", "REJECT"
    entity_type: str — "Patient", "LabResult", "Recommendation", ...
    entity_id: str (UUID as string)
    
    old_values: JSON (nullable)
    new_values: JSON (nullable)
    
    ip_address: str (nullable)
    user_agent: str (nullable)
    
    timestamp: datetime (index)
    
    # این جدول هرگز UPDATE یا DELETE نمی‌شود
```

---

### TASK-009 | Migration و Seed اولیه

**هدف:** راه‌اندازی دیتابیس و داده‌های اولیه

**آنچه باید پیاده‌سازی شود:**

```
alembic/env.py:
    - اتصال به تمام models
    - auto-generate migration support

Migration اولیه:
    - ایجاد تمام جداول
    - ایجاد indexها
    - ایجاد constraintها
    - ایجاد enumهای PostgreSQL

scripts/seed.py:
    - ایجاد کاربر ادمین اول
    - ایجاد داده‌های lab_reference_ranges:
        K:    {normal: 3.5-5.0, critical_low: 3.0, critical_high: 6.0, unit: mEq/L}
        Na:   {normal: 135-145, ...}
        Ca:   {normal: 8.5-10.5, ...}
        P:    {normal: 2.5-4.5, critical_high: 7.0, ...}
        Hb:   {normal: 10-12 برای دیالیز, critical_low: 8.0, ...}
        Alb:  {normal: 3.5-5.0, critical_low: 3.0, ...}
        ...
    - ایجاد محتوای آموزشی پایه (education_contents):
        HIGH_K, HIGH_P, LOW_HB, HIGH_IDWG, HIGH_BP, HIGH_CRP, LOW_ALB
    
scripts/create_admin.py:
    - دریافت اطلاعات از CLI و ایجاد اولین ادمین
```

---

## 🗂️ فاز ۲ — امنیت و احراز هویت (Security & Auth)

---

### TASK-010 | زیرساخت امنیت

**هدف:** پیاده‌سازی JWT، hash رمز عبور و RBAC

**آنچه باید پیاده‌سازی شود:**

```
app/infrastructure/security/password.py:
    - hash_password(plain: str) → str (bcrypt)
    - verify_password(plain: str, hashed: str) → bool
    - validate_password_strength(plain: str) → bool
      (حداقل ۸ کاراکتر، عدد، حرف)

app/infrastructure/security/jwt.py:
    - create_access_token(data: dict, expires_delta) → str
    - create_refresh_token(data: dict) → str
    - decode_token(token: str) → dict
    - TokenPayload schema:
        {sub: user_id, role: UserRole, exp: datetime, jti: UUID}

app/infrastructure/security/rbac.py:
    - PERMISSIONS: dict[UserRole, list[str]]
      تعریف دقیق مجوزها:
        ADMIN: ["*"]
        CLINICIAN: [
            "patient:read", "patient:create",
            "session:create", "session:read",
            "lab:create", "lab:read",
            "alert:read", "alert:acknowledge",
            "recommendation:read", "recommendation:review",
            "message:send"
        ]
        PATIENT: [
            "patient:read:own",
            "symptom:create:own", "symptom:read:own",
            "fluid:create:own", "fluid:read:own",
            "diet:create:own", "diet:read:own",
            "message:read:own",
            "alert:read:own"
        ]
    
    - require_permission(permission: str) → Dependency
    - require_role(*roles: UserRole) → Dependency
    - is_own_resource(user, patient_id) → bool
```

---

### TASK-011 | Auth Endpoints و Dependencies

**هدف:** پیاده‌سازی کامل احراز هویت

**آنچه باید پیاده‌سازی شود:**

```
app/api/deps.py:
    - get_db() → Session
    - get_current_user(token) → User
    - get_current_active_user(user) → User
    - require_clinician(user) → User
    - require_admin(user) → User
    - get_patient_or_404(patient_id, db) → Patient
    - verify_patient_access(user, patient) → bool
      (clinician می‌تواند به همه دسترسی داشته باشد؛
       patient فقط به خودش)

app/api/v1/endpoints/auth.py:
    POST /auth/login:
        - Input: {phone_number, password}
        - Output: {access_token, refresh_token, token_type, user_info}
        - Log: audit_log با action=LOGIN
        - Rate limit: حداکثر ۵ تلاش در ۱۰ دقیقه
    
    POST /auth/refresh:
        - Input: {refresh_token}
        - Output: {access_token}
    
    POST /auth/logout:
        - blacklist کردن token (با Redis)
    
    POST /auth/change-password:
        - فقط برای کاربر خودش
        - Input: {old_password, new_password}

app/services/auth_service.py:
    - authenticate_user(phone, password) → User | None
    - create_user_tokens(user) → TokenPair
    - invalidate_token(jti) — blacklist در Redis
    - is_token_blacklisted(jti) → bool
```

---

## 🗂️ فاز ۳ — Validators و Business Logic پایه

---

### TASK-012 | Validators پزشکی

**هدف:** اعتبارسنجی هوشمند داده‌های پزشکی قبل از ذخیره

**آنچه باید پیاده‌سازی شود:**

```
app/validators/bp_validator.py:
    - validate_bp_pair(systolic, diastolic):
        * systolic > diastolic (اجباری)
        * در محدوده منطقی (60-250 / 30-150)
        * pulse pressure معقول باشد (systolic - diastolic > 10)
    
    - validate_bp_session(pre, during, post):
        * هیچکدام اجباری نیستند ولی اگر وارد شد valid باشد
        * هشدار اگر افت فشار شدید حین به بعد

app/validators/dialysis_validator.py:
    - validate_session_weights(pre, post, dry_weight):
        * pre_weight در محدوده منطقی
        * post_weight <= pre_weight (بعد از دیالیز کمتر یا مساوی)
        * post_weight نزدیک به dry_weight باشد (اخطار اگر خیلی فاصله دارد)
        * IDWG = pre - dry_weight: اگر > 5kg خطا
    
    - validate_duration(minutes):
        * بین 60 تا 480 دقیقه

app/validators/lab_validator.py:
    - validate_lab_value(test_code, value, unit):
        * value در VALID_RANGE برای آن تست
        * unit با استاندارد سیستم مطابق باشد
        * مقادیر physiologically impossible رد شود
        * مثال: K=0.1 یا K=100 رد می‌شود
    
    - validate_lab_panel(results: list):
        * تست تکراری در یک پنل نباشد

app/validators/patient_validator.py:
    - validate_dry_weight(value, current_weight=None):
        * در محدوده منطقی
        * اگر current_weight داریم: dry_weight < current_weight + buffer
    
    - validate_phone_number(phone):
        * فرمت ایرانی: 09XXXXXXXXX
```

---

## 🗂️ فاز ۴ — سرویس‌های اصلی (Core Services)

---

### TASK-013 | سرویس مدیریت بیماران

**هدف:** تمام عملیات CRUD و business logic مربوط به بیمار

**آنچه باید پیاده‌سازی شود:**

```
app/services/patient_service.py:
    
    create_patient(data, created_by) → Patient:
        - ایجاد patient + user account (اگر بیمار اپ نصب کند)
        - ثبت audit_log
        - مقدار اولیه dry_weight
    
    update_patient(patient_id, data, updated_by) → Patient:
        - بررسی تغییر dry_weight:
          اگر dry_weight تغییر کرد → log جداگانه + آپدیت dry_weight_updated_at
        - ثبت audit_log با old/new values
    
    get_patient_summary(patient_id) → PatientSummary:
        - اطلاعات پایه
        - آخرین session
        - آخرین آزمایش‌ها
        - تعداد هشدارهای باز
        - آخرین وزن و روند
    
    get_patient_list(filters, page, size) → PaginatedResponse:
        - فیلتر: active/inactive, clinician_id
        - مرتب‌سازی: name, last_session, alert_count
    
    search_patients(query) → List[Patient]:
        - جستجو در: نام، کد بیمارستانی، شماره تلفن
    
    deactivate_patient(patient_id) → Patient:
        - soft delete (is_active = False)

app/api/v1/endpoints/patients.py:
    GET    /patients/              → list (clinician/admin)
    POST   /patients/              → create (clinician/admin)
    GET    /patients/{id}/         → detail
    PUT    /patients/{id}/         → update (clinician/admin)
    DELETE /patients/{id}/         → deactivate (admin)
    GET    /patients/{id}/summary/ → خلاصه داشبورد
    GET    /patients/{id}/timeline/→ تایم‌لاین رویدادهای بیمار
```

---

### TASK-014 | سرویس جلسات دیالیز

**هدف:** ثبت و مدیریت جلسات دیالیز با trigger تحلیل خودکار

**آنچه باید پیاده‌سازی شود:**

```
app/services/dialysis_service.py:
    
    create_session(patient_id, data, recorded_by) → DialysisSession:
        - اجرای dialysis_validator + bp_validator
        - محاسبه خودکار:
            * weight_gain = pre_weight - dry_weight_at_session
            * uf_volume = pre_weight - post_weight (اگر post داریم)
            * idwg_percent = (weight_gain / dry_weight) * 100
        - ذخیره snapshot از dry_weight فعلی
        - ثبت audit_log
        - TRIGGER: analysis_tasks.analyze_session.delay(session_id)
          (Celery task برای تحلیل)
    
    update_session(session_id, data, updated_by) → DialysisSession:
        - فقط session‌های 24 ساعت اخیر قابل ویرایش
        - ثبت audit_log با diff
        - اگر وزن یا BP تغییر کرد → re-trigger analysis
    
    get_patient_sessions(patient_id, limit, offset) → list:
        - مرتب‌سازی: جدیدترین اول
    
    get_session_detail(session_id) → SessionDetail:
        - شامل alertهای مربوط به آن session
    
    get_weight_trend(patient_id, n_sessions=8) → WeightTrend:
        - لیست pre_weight, post_weight, dry_weight, date
        - محاسبه: میانگین IDWG، روند (صعودی/نزولی)
    
    get_bp_trend(patient_id, n_sessions=8) → BPTrend:
        - لیست فشار قبل/حین/بعد به همراه تاریخ

app/api/v1/endpoints/dialysis_sessions.py:
    GET  /patients/{id}/sessions/        → list
    POST /patients/{id}/sessions/        → create
    GET  /patients/{id}/sessions/{sid}/  → detail
    PUT  /patients/{id}/sessions/{sid}/  → update
    GET  /patients/{id}/sessions/weight-trend/
    GET  /patients/{id}/sessions/bp-trend/
```

---

### TASK-015 | سرویس نتایج آزمایشگاهی

**هدف:** ثبت، اعتبارسنجی و مدیریت آزمایش‌ها با trigger تحلیل

**آنچه باید پیاده‌سازی شود:**

```
app/services/lab_service.py:
    
    create_lab_panel(patient_id, data, recorded_by) → LabPanel:
        - اعتبارسنجی هر نتیجه با lab_validator
        - تبدیل واحد در صورت نیاز (اگر واحد غیراستاندارد وارد شد)
        - محاسبه is_abnormal و abnormality_direction برای هر نتیجه
        - ثبت snapshot از ref_range فعلی
        - ثبت audit_log
        - TRIGGER: analysis_tasks.analyze_lab_panel.delay(panel_id)
    
    get_lab_history(patient_id, test_code, limit=10) → list:
        - تاریخچه یک تست مشخص
        - مرتب‌سازی: جدیدترین اول
    
    get_latest_labs(patient_id) → dict[LabTestCode, LabResult]:
        - آخرین مقدار هر تست
        - برای نمایش خلاصه وضعیت
    
    get_lab_trend(patient_id, test_code, n=6) → LabTrend:
        - تاریخچه + slope + وضعیت روند
    
    get_lab_panel_detail(panel_id) → LabPanelDetail:
        - تمام نتایج پنل + وضعیت هر کدام

app/api/v1/endpoints/lab_results.py:
    GET  /patients/{id}/labs/              → آخرین مقدار همه تست‌ها
    POST /patients/{id}/labs/              → ثبت پنل جدید
    GET  /patients/{id}/labs/history/      → تاریخچه (با filter test_code)
    GET  /patients/{id}/labs/{panel_id}/   → جزئیات پنل
    GET  /patients/{id}/labs/trend/{code}/ → روند یک تست
    GET  /labs/reference-ranges/           → لیست ref range همه تست‌ها
```

---

### TASK-016 | سرویس علائم و ثبت‌های بیمار

**هدف:** دریافت و ذخیره گزارش‌های خودگزارشی بیمار

**آنچه باید پیاده‌سازی شود:**

```
app/services/symptom_service.py:
    
    create_symptom_report(patient_id, data, reported_by) → SymptomReport:
        - بررسی علائم خطر فوری (CHEST_PAIN, SEVERE SHORTNESS_OF_BREATH):
          اگر وجود داشت → فوری Alert HIGH ایجاد کن
        - ثبت audit_log
        - TRIGGER: analysis_tasks.analyze_symptoms.delay(report_id)
    
    get_symptom_history(patient_id, limit, days=30) → list:
        - فیلتر بازه زمانی
    
    get_symptom_frequency(patient_id, days=90) → dict:
        - {symptom_type: count} برای تحلیل روند علائم

app/services/ (fluid و diet):
    
    log_fluid_intake(patient_id, date, total_ml, items) → FluidLog:
        - upsert (ویرایش اگر همان روز قبلاً ثبت شده)
        - اگر total_ml > threshold → alert
        - TRIGGER: analysis_tasks.analyze_fluid.delay(log_id)
    
    log_diet(patient_id, date, adherence_data) → DietLog:
        - upsert
        - اگر چند روز متوالی poor adherence → alert
        - ثبت audit_log

app/api/v1/endpoints/symptom_reports.py:
    POST /patients/{id}/symptoms/      → ثبت (بیمار یا clinician)
    GET  /patients/{id}/symptoms/      → تاریخچه
    GET  /patients/{id}/symptoms/summary/ → خلاصه فرکانس

app/api/v1/endpoints/fluid_logs.py:
    POST /patients/{id}/fluid/         → ثبت/ویرایش
    GET  /patients/{id}/fluid/         → تاریخچه (با date range)

app/api/v1/endpoints/diet_logs.py:
    POST /patients/{id}/diet/          → ثبت/ویرایش
    GET  /patients/{id}/diet/          → تاریخچه
```

---

## 🗂️ فاز ۵ — موتور تحلیل (Analysis Engine)

---

### TASK-017 | زیرساخت Rule Engine

**هدف:** یک framework قابل توسعه برای قوانین پزشکی

**آنچه باید پیاده‌سازی شود:**

```
app/analysis/rules/base.py:
    
    @dataclass
    class RuleResult:
        triggered: bool
        severity: AlertSeverity | None
        category: AlertCategory
        title: str
        clinician_explanation: str
        evidence: dict
        rule_name: str
        education_topic: str | None  # کد محتوای آموزشی پیشنهادی
        recommendation_text: str | None  # Draft پیشنهاد برای پزشک
    
    class BaseRule(ABC):
        name: str  # شناسه یکتای قانون
        category: AlertCategory
        
        @abstractmethod
        def evaluate(self, data: dict) → RuleResult:
            pass
        
        def _build_result(self, triggered, severity, ...) → RuleResult:
            pass

app/analysis/engine.py:
    
    class AnalysisEngine:
        def __init__(self):
            self.rules: list[BaseRule] = []
            self._register_all_rules()
        
        def _register_all_rules(self):
            # import و register تمام rules
        
        def run_for_session(self, session: DialysisSession, 
                           patient: Patient) → list[RuleResult]:
            # اجرای rules مرتبط با session
        
        def run_for_lab(self, panel: LabPanel, 
                       patient: Patient) → list[RuleResult]:
            # اجرای rules مرتبط با lab
        
        def run_for_symptom(self, report: SymptomReport,
                           patient: Patient) → list[RuleResult]:
            # اجرای rules مرتبط با علائم
        
        def run_for_fluid(self, log: FluidLog,
                         patient: Patient) → list[RuleResult]:
            pass
        
        def _filter_duplicate_alerts(self, results, 
                                     existing_alerts) → list[RuleResult]:
            # جلوگیری از ایجاد alert تکراری در بازه ۲۴ ساعت
```

---

### TASK-018 | قوانین وزن و IDWG

**هدف:** تشخیص افزایش وزن غیرطبیعی بین جلسات دیالیز

**آنچه باید پیاده‌سازی شود:**

```
app/analysis/rules/weight_rules.py:

class IDWGWarningRule(BaseRule):
    """IDWG بین 3% تا 5% وزن خشک"""
    name = "IDWG_WARNING"
    
    def evaluate(self, data):
        idwg_percent = data['idwg_percent']
        dry_weight = data['dry_weight']
        
        if 3.0 <= idwg_percent < 5.0:
            return RuleResult(
                triggered=True,
                severity=AlertSeverity.MEDIUM,
                title="افزایش وزن بین جلسات بالاتر از حد توصیه‌شده",
                clinician_explanation=f"IDWG={idwg_percent:.1f}% — "
                    f"بیمار {data['weight_gain']:.1f}kg بیش از وزن خشک دارد. "
                    f"بررسی مصرف مایعات و وزن خشک توصیه می‌شود.",
                evidence={
                    "pre_weight": data['pre_weight'],
                    "dry_weight": dry_weight,
                    "idwg_kg": data['weight_gain'],
                    "idwg_percent": idwg_percent
                },
                education_topic="HIGH_IDWG",
                recommendation_text="بررسی گزارش مصرف مایعات بیمار "
                    "و بازنگری dry weight در صورت لزوم."
            )
        return RuleResult(triggered=False, ...)

class IDWGCriticalRule(BaseRule):
    """IDWG بیش از 5% وزن خشک"""
    name = "IDWG_CRITICAL"
    severity = AlertSeverity.HIGH
    ...

class ConsecutiveHighIDWGRule(BaseRule):
    """IDWG بالا در چند جلسه متوالی"""
    name = "IDWG_CONSECUTIVE_HIGH"
    # نیاز به تاریخچه session دارد
    # اگر در 3 جلسه متوالی IDWG > 3% باشد → HIGH alert
    ...

class PostWeightFarFromDryRule(BaseRule):
    """وزن بعد از دیالیز خیلی دور از وزن خشک"""
    name = "POST_WEIGHT_DRY_WEIGHT_GAP"
    # اگر |post_weight - dry_weight| > 2kg
    ...
```

---

### TASK-019 | قوانین فشار خون

**هدف:** تشخییص افت فشار، فشار بالا و الگوهای خطرناک

**آنچه باید پیاده‌سازی شود:**

```
app/analysis/rules/bp_rules.py:

class PreDialysisHypertensionRule(BaseRule):
    """فشار خون بالا قبل از دیالیز"""
    name = "BP_PRE_HYPERTENSION"
    # systolic > 160 → MEDIUM
    # systolic > 180 → HIGH

class PreDialysisHypotensionRule(BaseRule):
    """فشار خون پایین قبل از دیالیز"""
    name = "BP_PRE_HYPOTENSION"
    # systolic < 100 → MEDIUM
    # systolic < 90 → HIGH

class IntradialyticHypotensionRule(BaseRule):
    """افت فشار حین دیالیز"""
    name = "IDH_DETECTED"
    # اگر during_systolic < 90
    # یا افت بیش از 20mmHg نسبت به قبل
    severity = AlertSeverity.HIGH

class PostDialysisHypotensionRule(BaseRule):
    name = "BP_POST_HYPOTENSION"
    ...

class BPTrendRule(BaseRule):
    """روند صعودی فشار خون در چند جلسه"""
    name = "BP_TREND_INCREASING"
    # نیاز به تاریخچه
    # اگر BP_pre در 4 جلسه اخیر روند صعودی داشته باشد
    severity = AlertSeverity.MEDIUM
```

---

### TASK-020 | قوانین آزمایشگاهی

**هدف:** تشخیص ناهنجاری‌های آزمایشگاهی و روندهای خطرناک

**آنچه باید پیاده‌سازی شود:**

```
app/analysis/rules/lab_rules.py:

# هر تست یک یا چند Rule دارد:

class HyperkalemiaRule(BaseRule):
    """پتاسیم بالا"""
    name = "HIGH_K"
    # K > 5.0 → LOW
    # K > 5.5 → MEDIUM  
    # K > 6.0 → HIGH (اورژانس قلبی)

class HypokalemiaRule(BaseRule):
    name = "LOW_K"
    # K < 3.5 → MEDIUM
    # K < 3.0 → HIGH

class HyperphosphatemiaRule(BaseRule):
    name = "HIGH_P"
    # P > 4.5 → LOW (آموزش رژیم)
    # P > 5.5 → MEDIUM
    # P > 7.0 → HIGH

class AnemiaRule(BaseRule):
    name = "LOW_HB"
    # Hb < 10 → MEDIUM
    # Hb < 8 → HIGH

class AnemiaTrendRule(BaseRule):
    """روند نزولی Hb"""
    name = "HB_DECLINING_TREND"
    # اگر در 3 پنل اخیر Hb روند نزولی داشت → MEDIUM

class HypoalbuminemiaRule(BaseRule):
    name = "LOW_ALB"
    # Alb < 3.5 → MEDIUM (نشانه سوءتغذیه)
    # Alb < 3.0 → HIGH

class HyperphosphatemiaWithDietRule(BaseRule):
    """P بالا + گزارش رژیم ضعیف"""
    name = "HIGH_P_POOR_DIET"
    # ترکیب: P بالا + phosphorus_adherence=POOR در هفته اخیر
    # → پیشنهاد آموزش بایندر فسفات

# و به همین شکل برای: Na, Ca, CRP, Ferritin, PTH, Urea
```

---

### TASK-021 | قوانین علائم و ترکیبی

**هدف:** تشخیص الگوهای خطرناک علائم و ترکیب چند منبع داده

**آنچه باید پیاده‌سازی شود:**

```
app/analysis/rules/symptom_rules.py:

class SevereSymptomRule(BaseRule):
    """علائم شدید نیازمند توجه فوری"""
    name = "SEVERE_SYMPTOM_ALERT"
    DANGER_SYMPTOMS = [CHEST_PAIN, SHORTNESS_OF_BREATH]
    # اگر هر کدام با شدت SEVERE → HIGH alert فوری

class RecurrentSymptomsRule(BaseRule):
    """علائم تکرارشونده"""
    name = "RECURRING_SYMPTOMS"
    # اگر یک علامت در 5 روز اخیر 3+ بار ثبت شده → MEDIUM

class AccessSitePainRule(BaseRule):
    """درد محل دسترسی عروقی"""
    name = "ACCESS_SITE_CONCERN"
    # درد محل فیستول → بررسی عفونت/ترومبوز
    severity = AlertSeverity.MEDIUM

# قوانین ترکیبی (Cross-domain):

class FluidOverloadPatternRule(BaseRule):
    """الگوی احتباس مایعات"""
    name = "FLUID_OVERLOAD_PATTERN"
    # ترکیب:
    # IDWG بالا + تنگی نفس + مصرف مایعات زیاد
    # → HIGH alert: احتمال Fluid Overload
    severity = AlertSeverity.HIGH

class MalnutritionRiskRule(BaseRule):
    """ریسک سوءتغذیه"""
    name = "MALNUTRITION_RISK"
    # Albumin پایین + بی‌اشتهایی + poor protein adherence
    severity = AlertSeverity.MEDIUM
```

---

### TASK-022 | تحلیل روند (Trend Analyzer)

**هدف:** تشخیص روندهای تدریجی که ممکن است از rule‌های نقطه‌ای بگریزند

**آنچه باید پیاده‌سازی شود:**

```
app/analysis/trends.py:

class TrendAnalyzer:
    
    def calculate_slope(self, values: list[float], 
                       dates: list[date]) → float:
        """Linear regression slope با pandas/numpy"""
    
    def classify_trend(self, slope: float, 
                      threshold: float) → str:
        """increasing / decreasing / stable"""
    
    def analyze_lab_trend(self, patient_id: UUID,
                         test_code: LabTestCode,
                         n_results: int = 4) → TrendResult:
        """
        خروجی:
        - direction: increasing/decreasing/stable
        - slope: عدد
        - values: لیست مقادیر
        - is_concerning: bool (آیا روند نگران‌کننده است؟)
        - interpretation_fa: توضیح فارسی
        """
    
    def analyze_weight_trend(self, patient_id: UUID,
                            n_sessions: int = 6) → TrendResult:
        """روند IDWG در جلسات اخیر"""
    
    def analyze_bp_trend(self, patient_id: UUID,
                        n_sessions: int = 6) → BPTrendResult:
        """روند فشار خون قبل از دیالیز"""
    
    def detect_gradual_deterioration(self, patient_id: UUID) → list[TrendResult]:
        """
        اجرای تحلیل روند روی همه پارامترهای اصلی
        و گزارش مواردی که روند نگران‌کننده دارند
        حتی اگر هنوز از threshold رد نشده باشند
        """
```

---

### TASK-023 | Risk Scoring (امتیاز ریسک ساده)

**هدف:** یک نمره کلی ریسک برای هر بیمار بر اساس وضعیت جاری

**آنچه باید پیاده‌سازی شود:**

```
app/analysis/risk.py:

class RiskScorer:
    """
    نه یک مدل ML پیچیده، بلکه یک سیستم امتیازدهی
    قابل توضیح بر اساس وضعیت پارامترها
    """
    
    # وزن هر فاکتور در نمره کلی
    WEIGHT_MAP = {
        "active_high_alerts": 30,
        "active_medium_alerts": 10,
        "idwg_status": 15,
        "bp_trend": 15,
        "hb_status": 10,
        "k_status": 20,
        "albumin_status": 10,
        "symptom_frequency": 10,
        ...
    }
    
    def calculate_risk_score(self, patient_id: UUID) → RiskScore:
        """
        خروجی:
        - score: 0-100
        - level: LOW/MEDIUM/HIGH
        - contributing_factors: [
            {factor: "HIGH_K", contribution: 20, detail: "K=6.2"},
            {factor: "HIGH_IDWG", contribution: 15, detail: "IDWG=4.5%"},
            ...
          ]
        - interpretation_fa: خلاصه فارسی
        """
    
    def get_risk_trend(self, patient_id: UUID, 
                      n_weeks: int = 4) → list[RiskScore]:
        """نمره ریسک هفته به هفته"""
```

---

### TASK-024 | سرویس هشدار و توصیه

**هدف:** مدیریت چرخه کامل از تولید هشدار تا تأیید پزشک

**آنچه باید پیاده‌سازی شود:**

```
app/services/alert_service.py:
    
    create_alert_from_rule(patient_id, rule_result) → Alert:
        - جلوگیری از duplicate (همان rule در 24 ساعت اخیر)
        - ذخیره alert
        - اگر severity=HIGH → ایجاد recommendation draft خودکار
    
    acknowledge_alert(alert_id, clinician_id) → Alert:
        - وضعیت: NEW → ACKNOWLEDGED
        - ثبت audit_log
    
    resolve_alert(alert_id, clinician_id) → Alert:
        - وضعیت → RESOLVED
    
    get_patient_alerts(patient_id, status, severity) → list[Alert]:
    
    get_all_active_alerts(clinician_id) → list[Alert]:
        """داشبورد کلینیسین: همه هشدارهای باز"""

app/services/recommendation_service.py:
    
    create_draft(patient_id, alert_id, 
                rule_result, trend_data) → Recommendation:
        - ساخت draft_for_clinician با template:
            "مشاهدات: {evidence}
             روند: {trend_interpretation}
             ریسک: {risk_level}
             پیشنهاد بررسی: {recommendation_text}"
        - ساخت patient_content پیشنهادی (از education library)
    
    approve_recommendation(rec_id, clinician_id,
                          patient_content=None) → Recommendation:
        - اگر patient_content وارد شد: ویرایش متن
        - وضعیت → APPROVED
        - ثبت audit_log
        - ایجاد PatientMessage
    
    reject_recommendation(rec_id, clinician_id, 
                         reason) → Recommendation:
        - وضعیت → REJECTED
        - ثبت reason
    
    get_pending_recommendations(clinician_id) → list[Recommendation]:
        """لیست draftهای منتظر بررسی"""

app/api/v1/endpoints/alerts.py:
    GET  /alerts/                          → همه active (clinician)
    GET  /patients/{id}/alerts/            → alerts یک بیمار
    PUT  /alerts/{id}/acknowledge/         → تأیید دیدن
    PUT  /alerts/{id}/resolve/             → بستن

app/api/v1/endpoints/recommendations.py:
    GET  /recommendations/pending/         → لیست دraftها
    GET  /patients/{id}/recommendations/   → تاریخچه
    POST /recommendations/{id}/approve/    → تأیید
    POST /recommendations/{id}/reject/     → رد
```

---

### TASK-025 | Celery Tasks (پردازش پس‌زمینه)

**هدف:** اجرای تحلیل‌ها به صورت async برای عدم کند شدن API

**آنچه باید پیاده‌سازی شود:**

```
app/tasks/celery_app.py:
    - پیکربندی Celery با Redis
    - task queues: analysis (high priority), notification (normal)
    - retry policy: max_retries=3, countdown=60

app/tasks/analysis_tasks.py:
    
    @celery_app.task(queue='analysis')
    def analyze_session(session_id: str):
        """
        1. دریافت session از DB
        2. دریافت patient (با dry_weight)
        3. دریافت تاریخچه (n_sessions قبلی)
        4. اجرای weight_rules
        5. اجرای bp_rules
        6. اجرای TrendAnalyzer برای BP و وزن
        7. ایجاد Alert‌ها از نتایج
        8. اگر لازم: ایجاد RecommendationDraft
        """
    
    @celery_app.task(queue='analysis')
    def analyze_lab_panel(panel_id: str):
        """
        1. دریافت panel + results
        2. اجرای lab_rules برای هر result
        3. TrendAnalyzer برای تست‌های تغییرکرده
        4. Cross-domain rules (مثلاً HIGH_P + POOR_DIET)
        5. RiskScorer.calculate_risk_score → ذخیره
        6. ایجاد Alert‌ها
        """
    
    @celery_app.task(queue='analysis')
    def analyze_symptoms(report_id: str):
        """
        1. بررسی علائم خطر فوری
        2. بررسی الگوی تکرار
        3. Cross-domain: ترکیب با آخرین session/lab
        """
    
    @celery_app.task(queue='analysis')
    def analyze_fluid(log_id: str):
        """مصرف مایعات + IDWG cross-domain"""
    
    @celery_app.task
    def daily_patient_review():
        """
        Cron job روزانه (صبح):
        - بررسی بیمارانی که چند روز است داده جدید ندارند
        - اجرای TrendAnalyzer روی همه بیماران
        - بررسی بیمارانی که آزمایش دوره‌ای‌شان عقب افتاده
        - تولید reminder alerts
        """
```

---

## 🗂️ فاز ۶ — پیام‌رسانی و آموزش

---

### TASK-026 | سرویس پیام‌ها و آموزش

**هدف:** ارسال آموزش‌های تأییدشده به بیمار و مدیریت کتابخانه آموزشی

**آنچه باید پیاده‌سازی شود:**

```
app/services/message_service.py:
    
    send_message_to_patient(patient_id, recommendation_id,
                           content, sent_by) → PatientMessage:
        - فقط بعد از approve recommendation فراخوانی می‌شود
        - ثبت PatientMessage
        - ثبت audit_log: "پیام ارسال شد توسط {clinician}"
    
    mark_message_read(message_id, patient_id) → PatientMessage:
        - فقط خود بیمار می‌تواند
        - ثبت read_at
    
    get_patient_messages(patient_id, unread_only=False) → list:
    
    get_unread_count(patient_id) → int:

app/services/education_service.py:
    
    get_content_for_topic(topic_code) → EducationContent:
    
    get_relevant_content(patient_id) → list[EducationContent]:
        """
        بر اساس وضعیت فعلی بیمار:
        - آخرین آزمایش‌ها
        - هشدارهای فعال
        - الگوی ثبت‌های اخیر
        → محتواهای مرتبط را برمی‌گرداند
        """
    
    search_education(query, tags) → list[EducationContent]:
    
    get_all_education(active_only=True) → list:

app/api/v1/endpoints/messages.py:
    GET  /patients/{id}/messages/           → دریافت پیام‌ها (بیمار)
    PUT  /messages/{id}/read/               → علامت خوانده‌شده
    GET  /patients/{id}/messages/unread-count/

app/api/v1/endpoints/education.py:
    GET  /education/                        → همه محتوا (admin/clinician)
    GET  /education/{topic_code}/           → یک محتوا
    GET  /patients/{id}/education/relevant/ → محتوای مرتبط با بیمار (بیمار/clinician)
    POST /education/                        → ایجاد محتوا (admin)
    PUT  /education/{id}/                   → ویرایش (admin)
```

---

## 🗂️ فاز ۷ — داشبوردها و گزارش‌ها

---

### TASK-027 | داشبورد بیمار

**هدف:** endpoint هایی برای نمایش خلاصه وضعیت به بیمار

**آنچه باید پیاده‌سازی شود:**

```
app/api/v1/endpoints/patients.py (ادامه):

GET /patients/{id}/dashboard/:
    """
    خروجی یکجا برای بیمار:
    {
        patient_info: {name, dry_weight, next_session_reminder},
        
        weight_summary: {
            last_pre_weight, last_post_weight,
            dry_weight, weight_gain,
            idwg_percent, status: "OK/WARNING/CRITICAL",
            trend: "stable/increasing/decreasing"
        },
        
        bp_summary: {
            last_pre: {systolic, diastolic},
            trend: "...",
            status: "..."
        },
        
        lab_summary: {
            K: {value, date, status},
            Hb: {value, date, status},
            P: {value, date, status},
            Alb: {value, date, status},
            ...
        },
        
        recent_messages: [...],  // 3 پیام آخر
        unread_count: int,
        
        relevant_education: [...]  // 2-3 محتوای مرتبط
    }
    """

GET /patients/{id}/trends/:
    """
    داده‌های نمودار برای بیمار:
    {
        weight_chart: [{date, pre_weight, dry_weight}],
        bp_chart: [{date, systolic, diastolic}],
        lab_charts: {
            K: [{date, value}],
            Hb: [{date, value}],
            ...
        }
    }
    """
```

---

### TASK-028 | داشبورد کلینیسین

**هدف:** endpoint هایی برای مدیریت و مانیتورینگ همه بیماران

**آنچه باید پیاده‌سازی شود:**

```
GET /clinician/dashboard/:
    """
    {
        stats: {
            total_patients: int,
            active_alerts_high: int,
            active_alerts_medium: int,
            pending_recommendations: int,
            patients_with_no_recent_data: int  // >7 روز
        },
        
        urgent_patients: [  // بیماران با HIGH alert
            {patient_id, name, alert_count, highest_severity, ...}
        ],
        
        pending_recommendations: [
            {rec_id, patient_name, draft_text, created_at, ...}
        ],
        
        recent_activity: [  // آخرین ثبت‌ها
            {type: "lab/session/symptom", patient, time}
        ]
    }
    """

GET /clinician/patients-overview/:
    """
    جدول بیماران با وضعیت:
    [{
        patient_id, name, medical_record,
        last_session_date, last_lab_date,
        active_alerts: {high, medium, low},
        risk_score: int,
        weight_status: "OK/WARNING",
        bp_status: "OK/WARNING"
    }]
    مرتب‌سازی: بر اساس risk_score یا alert_count
    """

GET /clinician/alerts-feed/:
    """
    جریان هشدارهای جدید با pagination
    [{alert + patient_info + actions}]
    """
```

---

## 🗂️ فاز ۸ — زیرساخت‌های تکمیلی

---

### TASK-029 | Audit Logging سیستماتیک

**هدف:** ثبت خودکار تمام تغییرات مهم بدون نیاز به کد تکراری

**آنچه باید پیاده‌سازی شود:**

```
app/infrastructure/auditing/logger.py:
    
    class AuditLogger:
        def log(self, db, user_id, action, 
                entity_type, entity_id,
                old_values=None, new_values=None,
                request=None) → AuditLog:
            """
            - خودکار ip_address و user_agent از request
            - diff محاسبه می‌کند (چه فیلدهایی عوض شدند)
            - ذخیره async (برای عدم کند کردن response)
            """
        
        def log_login(self, db, user_id, ip, success) → AuditLog
        
        def log_data_change(self, db, user_id, entity, 
                           old, new) → AuditLog
        
        def log_approval(self, db, user_id, entity_type,
                        entity_id, action) → AuditLog

# FastAPI middleware برای audit خودکار
app/middleware/audit_middleware.py:
    - ثبت تمام POST/PUT/DELETE requestها با response status
    - اطلاعات: endpoint, method, user, ip, timestamp, status_code

# Decorator برای موارد خاص:
@audit_action("APPROVE_RECOMMENDATION")
def approve_recommendation(...):
    ...
```

---

### TASK-030 | Exception Handling و Responses استاندارد

**هدف:** پاسخ‌های یکدست و مدیریت خطاهای قابل فهم

**آنچه باید پیاده‌سازی شود:**

```
app/exceptions/business_exceptions.py:
    class PatientNotFoundError(Exception): ...
    class DuplicateLabPanelError(Exception): ...
    class InvalidLabValueError(Exception): ...
    class InvalidBPError(Exception): ...
    class UnauthorizedAccessError(Exception): ...
    class RecommendationAlreadyReviewedError(Exception): ...
    class SessionAlreadyExistsError(Exception): ...

app/exceptions/http_exceptions.py:
    - handler برای هر exception → HTTP response مناسب
    - فرمت خطا یکدست:
    {
        "success": false,
        "error": {
            "code": "INVALID_LAB_VALUE",
            "message": "مقدار پتاسیم وارد‌شده خارج از محدوده منطقی است",
            "details": {"field": "K", "value": 150, "valid_range": [1, 15]}
        }
    }

app/api/responses.py:
    class SuccessResponse(BaseModel):
        success: bool = True
        data: Any
        message: str | None
    
    class PaginatedResponse(BaseModel):
        success: bool = True
        data: list
        total: int
        page: int
        size: int
        pages: int
    
    class ErrorResponse(BaseModel):
        success: bool = False
        error: ErrorDetail
```

---

### TASK-031 | Events و Domain Event Bus

**هدف:** جداسازی سرویس‌ها از هم با یک Event Bus ساده

**آنچه باید پیاده‌سازی شود:**

```
app/events/domain_events.py:
    @dataclass
    class DialysisSessionCreated:
        session_id: UUID
        patient_id: UUID
        timestamp: datetime
    
    @dataclass
    class LabPanelCreated:
        panel_id: UUID
        patient_id: UUID
        test_codes: list[str]
    
    @dataclass
    class SymptomReported:
        report_id: UUID
        patient_id: UUID
        has_danger_symptoms: bool
    
    @dataclass
    class RecommendationApproved:
        recommendation_id: UUID
        patient_id: UUID
        clinician_id: UUID

app/events/publisher.py:
    class EventPublisher:
        def publish(self, event) → None:
            """
            در MVP: مستقیم Celery task را trigger می‌کند
            در آینده: می‌تواند به message broker واقعی متصل شود
            """
        
        handlers = {
            DialysisSessionCreated: [analyze_session_task],
            LabPanelCreated: [analyze_lab_panel_task],
            SymptomReported: [analyze_symptoms_task],
            RecommendationApproved: [send_message_task],
        }
```

---

### TASK-032 | تست‌ها

**هدف:** پوشش تست کافی برای اطمینان از صحت سیستم پزشکی

**آنچه باید پیاده‌سازی شود:**

```
tests/conftest.py:
    - fixture: db session (in-memory یا test DB)
    - fixture: test client (FastAPI TestClient)
    - fixture: کاربران نمونه (admin, clinician, patient)
    - fixture: بیمار نمونه با داده‌های اولیه

tests/unit/analysis/:
    test_weight_rules.py:
        - IDWG در حد طبیعی: alert نباشد
        - IDWG 3.5%: MEDIUM alert
        - IDWG 6%: HIGH alert
        - چند جلسه متوالی بالا: ConsecutiveHigh trigger شود
    
    test_bp_rules.py:
        - BP طبیعی: alert نباشد
        - BP_PRE_SYSTOLIC=185: HIGH alert
        - افت حین دیالیز بیش از 20mmHg: IDH alert
    
    test_lab_rules.py:
        - K=6.5: HIGH alert
        - K=5.2: LOW alert
        - K=4.5: no alert
        - Hb روند نزولی 3 پنل: trend alert
    
    test_trends.py:
        - داده یکنواخت: slope ≈ 0
        - داده صعودی: direction = "increasing"
    
    test_risk_scorer.py:
        - بیمار سالم: score < 20
        - بیمار با چند alert HIGH: score > 70

tests/unit/validators/:
    test_bp_validator.py:
        - systolic < diastolic: ValueError
        - systolic=300: ValueError
        - BP سالم: pass
    
    test_lab_validator.py:
        - K=150: ValueError
        - K=4.5 با unit=mEq/L: pass

tests/integration/api/:
    test_auth.py: login صحیح، اشتباه، token expire
    test_patients.py: CRUD + دسترسی نقش‌ها
    test_dialysis.py: ثبت session + trigger analysis
    test_labs.py: ثبت panel + validation
    test_alerts.py: تولید alert + acknowledge + resolve
    test_recommendations.py: approve/reject + ارسال پیام
    test_access_control.py:
        - بیمار نمی‌تواند به داده بیمار دیگر دسترسی داشته باشد
        - بیمار نمی‌تواند alert approve کند
```

---

### TASK-033 | ادمین و مدیریت سیستم

**هدف:** endpoints برای مدیریت کاربران و تنظیمات

**آنچه باید پیاده‌سازی شود:**

```
app/api/v1/endpoints/ (admin-only):

مدیریت کاربران:
    GET    /admin/users/              → لیست کاربران
    POST   /admin/users/              → ایجاد کاربر (clinician/patient)
    PUT    /admin/users/{id}/         → ویرایش
    POST   /admin/users/{id}/activate/
    POST   /admin/users/{id}/deactivate/
    POST   /admin/users/{id}/reset-password/

لاگ‌ها:
    GET    /admin/audit-logs/         → با filter: user, entity, action, date
    GET    /admin/audit-logs/export/  → CSV export

وضعیت سیستم:
    GET    /admin/system/health/      → DB, Redis, Celery status
    GET    /admin/system/stats/       → آمار کلی: تعداد بیمار، session، alert
    GET    /admin/celery/tasks/       → وضعیت taskهای در حال اجرا

محتوای آموزشی:
    → (در education endpoint اما فقط admin می‌تواند create/update کند)
```

---

### TASK-034 | مستندات API و Configuration نهایی

**هدف:** مستندسازی کامل و آماده‌سازی برای deploy

**آنچه باید پیاده‌سازی شود:**

```
app/main.py:
    - FastAPI app با metadata کامل
    - تنظیم CORS (فقط origin های مجاز)
    - Mount کردن v1 router
    - Exception handlers
    - Startup/Shutdown events:
        * بررسی اتصال DB
        * بررسی اتصال Redis
        * اجرای pending migrations (اختیاری)
    - Middleware:
        * Request logging
        * Audit middleware
        * Rate limiting (slowapi)

مستندات:
    - تمام endpoint ها: docstring فارسی/انگلیسی
    - schema examples در Pydantic models
    - Swagger UI در /docs (فقط در development)
    - README.md کامل با:
        * نحوه راه‌اندازی
        * ساختار پروژه
        * نحوه اجرای test
        * نحوه افزودن Rule جدید

docker-compose.yml نهایی:
    - volumes برای postgres data
    - healthcheck برای همه سرویس‌ها
    - environment variables از .env
    - restart policy

.env.example:
    DATABASE_URL=postgresql://...
    SECRET_KEY=...
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    REFRESH_TOKEN_EXPIRE_DAYS=7
    REDIS_URL=redis://redis:6379/0
    CELERY_BROKER_URL=redis://redis:6379/1
    ENVIRONMENT=development
    DEBUG=true
```

---

## 📊 نقشه وابستگی تسک‌ها

```
TASK-001 (پایه)
    └── TASK-002 (Config)
        └── TASK-003 (Enums)
            ├── TASK-004 (Models: User/Patient)
            │   ├── TASK-005 (Models: Session)
            │   ├── TASK-006 (Models: Lab)
            │   ├── TASK-007 (Models: Symptom/Fluid/Diet)
            │   └── TASK-008 (Models: Alert/Rec/Message)
            │       └── TASK-009 (Migration + Seed)
            │           ├── TASK-010 (Security)
            │           │   └── TASK-011 (Auth Endpoints)
            │           ├── TASK-012 (Validators)
            │           ├── TASK-013 (Patient Service)
            │           ├── TASK-014 (Dialysis Service)
            │           ├── TASK-015 (Lab Service)
            │           ├── TASK-016 (Symptom/Fluid/Diet Service)
            │           │
            │           ├── TASK-017 (Rule Engine Base)
            │           │   ├── TASK-018 (Weight Rules)
            │           │   ├── TASK-019 (BP Rules)
            │           │   ├── TASK-020 (Lab Rules)
            │           │   └── TASK-021 (Symptom Rules)
            │           │       └── TASK-022 (Trend Analyzer)
            │           │           └── TASK-023 (Risk Scorer)
            │           │
            │           ├── TASK-024 (Alert/Rec Service)
            │           │   └── TASK-025 (Celery Tasks)
            │           │       └── TASK-026 (Messages/Education)
            │           │           ├── TASK-027 (Patient Dashboard)
            │           │           └── TASK-028 (Clinician Dashboard)
            │           │
            │           ├── TASK-029 (Audit Logging)
            │           ├── TASK-030 (Exceptions/Responses)
            │           ├── TASK-031 (Event Bus)
            │           └── TASK-032 (Tests)
            │               ├── TASK-033 (Admin)
            │               └── TASK-034 (Docs/Deploy)
```

---

## 📋 خلاصه تسک‌ها

| # | تسک | فاز | اولویت |
|---|-----|-----|--------|
| 001 | راه‌اندازی پروژه | ۰ | 🔴 بحرانی |
| 002 | Config مرکزی | ۰ | 🔴 بحرانی |
| 003 | Enums و Constants | ۰ | 🔴 بحرانی |
| 004 | Models: User/Patient | ۱ | 🔴 بحرانی |
| 005 | Models: Session | ۱ | 🔴 بحرانی |
| 006 | Models: Lab | ۱ | 🔴 بحرانی |
| 007 | Models: Symptom/Fluid/Diet | ۱ | 🔴 بحرانی |
| 008 | Models: Alert/Rec/Message | ۱ | 🔴 بحرانی |
| 009 | Migration + Seed | ۱ | 🔴 بحرانی |
| 010 | Security Infrastructure | ۲ | 🔴 بحرانی |
| 011 | Auth Endpoints | ۲ | 🔴 بحرانی |
| 012 | Validators پزشکی | ۳ | 🔴 بحرانی |
| 013 | Patient Service | ۴ | 🔴 بحرانی |
| 014 | Dialysis Service | ۴ | 🔴 بحرانی |
| 015 | Lab Service | ۴ | 🔴 بحرانی |
| 016 | Symptom/Fluid/Diet | ۴ | 🟠 بالا |
| 017 | Rule Engine Base | ۵ | 🔴 بحرانی |
| 018 | Weight Rules | ۵ | 🔴 بحرانی |
| 019 | BP Rules | ۵ | 🔴 بحرانی |
| 020 | Lab Rules | ۵ | 🔴 بحرانی |
| 021 | Symptom Rules | ۵ | 🟠 بالا |
| 022 | Trend Analyzer | ۵ | 🟠 بالا |
| 023 | Risk Scorer | ۵ | 🟡 متوسط |
| 024 | Alert/Rec Service | ۵ | 🔴 بحرانی |
| 025 | Celery Tasks | ۵ | 🔴 بحرانی |
| 026 | Messages/Education | ۶ | 🟠 بالا |
| 027 | Patient Dashboard | ۷ | 🟠 بالا |
| 028 | Clinician Dashboard | ۷ | 🟠 بالا |
| 029 | Audit Logging | ۸ | 🔴 بحرانی |
| 030 | Exceptions/Responses | ۸ | 🔴 بحرانی |
| 031 | Event Bus | ۸ | 🟡 متوسط |
| 032 | Tests | ۸ | 🟠 بالا |
| 033 | Admin | ۸ | 🟡 متوسط |
| 034 | Docs/Deploy | ۸ | 🟠 بالا |

---

هر وقت آماده بودی، بگو از کدام تسک شروع کنیم و کد کامل را می‌نویسیم.