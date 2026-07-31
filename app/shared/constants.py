"""
ثابت‌های سیستم همودیالیز
"""

from app.shared.enums import LabTestCode


# واحدهای آزمایش‌ها

LAB_UNITS: dict[str, str] = {
    LabTestCode.POTASSIUM: "mEq/L",
    LabTestCode.SODIUM: "mEq/L",
    LabTestCode.CALCIUM: "mg/dL",
    LabTestCode.PHOSPHORUS: "mg/dL",
    LabTestCode.BICARBONATE: "mEq/L",
    LabTestCode.HEMOGLOBIN: "g/dL",
    LabTestCode.HEMATOCRIT: "%",
    LabTestCode.FERRITIN: "ng/mL",
    LabTestCode.TSAT: "%",
    LabTestCode.ALBUMIN: "g/dL",
    LabTestCode.CRP: "mg/L",
    LabTestCode.PTH: "pg/mL",
    LabTestCode.UREA: "mg/dL",
    LabTestCode.CREATININE: "mg/dL",
    LabTestCode.CHOLESTEROL: "mg/dL",
    LabTestCode.TRIGLYCERIDE: "mg/dL",
}


# نام فارسی آزمایش‌ها

LAB_NAMES_FA: dict[str, str] = {
    LabTestCode.POTASSIUM: "پتاسیم",
    LabTestCode.SODIUM: "سدیم",
    LabTestCode.CALCIUM: "کلسیم",
    LabTestCode.PHOSPHORUS: "فسفر",
    LabTestCode.BICARBONATE: "بی‌کربنات",
    LabTestCode.HEMOGLOBIN: "هموگلوبین",
    LabTestCode.HEMATOCRIT: "هماتوکریت",
    LabTestCode.FERRITIN: "فریتین",
    LabTestCode.TSAT: "اشباع ترانسفرین",
    LabTestCode.ALBUMIN: "آلبومین",
    LabTestCode.CRP: "پروتئین واکنشی C",
    LabTestCode.PTH: "هورمون پاراتیروئید",
    LabTestCode.UREA: "اوره",
    LabTestCode.CREATININE: "کراتینین",
    LabTestCode.CHOLESTEROL: "کلسترول",
    LabTestCode.TRIGLYCERIDE: "تری‌گلیسرید",
}


# محدوده منطقی ورود دستی آزمایش‌ها

LAB_VALID_RANGES: dict[str, tuple[float, float]] = {
    LabTestCode.POTASSIUM: (1.0, 10.0),
    LabTestCode.SODIUM: (110.0, 170.0),
    LabTestCode.CALCIUM: (4.0, 16.0),
    LabTestCode.PHOSPHORUS: (0.5, 15.0),
    LabTestCode.BICARBONATE: (5.0, 45.0),
    LabTestCode.HEMOGLOBIN: (3.0, 20.0),
    LabTestCode.HEMATOCRIT: (10.0, 65.0),
    LabTestCode.FERRITIN: (1.0, 5000.0),
    LabTestCode.TSAT: (1.0, 100.0),
    LabTestCode.ALBUMIN: (1.0, 6.0),
    LabTestCode.CRP: (0.1, 500.0),
    LabTestCode.PTH: (1.0, 3000.0),
    LabTestCode.UREA: (10.0, 500.0),
    LabTestCode.CREATININE: (0.1, 50.0),
    LabTestCode.CHOLESTEROL: (50.0, 500.0),
    LabTestCode.TRIGLYCERIDE: (20.0, 2000.0),
}


# ثابت‌های پیجینیشن

DEFAULT_PAGE = 1
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


# ثابت‌های زمانی

SESSION_MIN_DURATION_MINUTES = 60
SESSION_MAX_DURATION_MINUTES = 480

# بازه زمانی برای بررسی duplicate alert (ساعت)
ALERT_DUPLICATE_WINDOW_HOURS = 24

# تعداد روزهایی که بیمار داده ندارد → هشدار
PATIENT_NO_DATA_WARNING_DAYS = 7


# ثابت‌های نمایش

TREND_DISPLAY_SESSIONS = 8    # تعداد جلسات برای نمودار
TREND_DISPLAY_LAB_RESULTS = 6  # تعداد آزمایش برای نمودار


# کدهای محتوای آموزشی

EDUCATION_TOPICS = {
    "HIGH_K": "پتاسیم بالا",
    "LOW_K": "پتاسیم پایین",
    "HIGH_P": "فسفر بالا",
    "LOW_HB": "کم‌خونی",
    "HIGH_IDWG": "افزایش وزن زیاد بین جلسات",
    "HIGH_BP": "فشار خون بالا",
    "LOW_BP": "فشار خون پایین",
    "IDH": "افت فشار حین دیالیز",
    "LOW_ALB": "آلبومین پایین (سوءتغذیه)",
    "HIGH_CRP": "التهاب (CRP بالا)",
    "FLUID_CONTROL": "کنترل مصرف مایعات",
    "PHOSPHATE_BINDER": "داروهای فسفات‌بایندر",
    "DIET_GENERAL": "رژیم غذایی در دیالیز",
    "ACCESS_CARE": "مراقبت از محل دسترسی عروقی",
}