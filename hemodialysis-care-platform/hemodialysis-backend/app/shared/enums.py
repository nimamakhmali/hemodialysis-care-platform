from enum import Enum


class UserRole(str, Enum):
    """نقش‌های کاربری سیستم"""
    PATIENT = "patient"
    CLINICIAN = "clinician"   # پزشک یا پرستار ناظر
    ADMIN = "admin"


class AlertSeverity(str, Enum):
    """سطح شدت هشدار"""
    LOW = "low"        # آموزشی / قابل مدیریت
    MEDIUM = "medium"  # نیاز به بررسی در ویزیت بعدی
    HIGH = "high"      # نیاز به توجه فوری


class AlertCategory(str, Enum):
    """دسته‌بندی هشدار"""
    WEIGHT = "weight"
    BLOOD_PRESSURE = "blood_pressure"
    LAB = "lab"
    SYMPTOM = "symptom"
    FLUID = "fluid"
    DIET = "diet"
    COMBINED = "combined"   # هشدارهای ترکیبی چند منبع


class AlertStatus(str, Enum):
    """وضعیت هشدار"""
    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class RecommendationStatus(str, Enum):
    """وضعیت توصیه/پیشنهاد"""
    DRAFT = "draft"
    APPROVED = "approved"
    EDITED = "edited"    # پزشک ویرایش کرده و تأیید کرده
    REJECTED = "rejected"


class SymptomType(str, Enum):
    """انواع علائم قابل گزارش توسط بیمار"""
    SHORTNESS_OF_BREATH = "shortness_of_breath"   # تنگی نفس
    DIZZINESS = "dizziness"                        # سرگیجه
    ACCESS_SITE_PAIN = "access_site_pain"          # درد محل دسترسی عروقی
    MUSCLE_CRAMP = "muscle_cramp"                  # گرفتگی عضلات
    NAUSEA = "nausea"                              # تهوع
    VOMITING = "vomiting"                          # استفراغ
    ITCHING = "itching"                            # خارش
    HEADACHE = "headache"                          # سردرد
    FATIGUE = "fatigue"                            # خستگی شدید
    CHEST_PAIN = "chest_pain"                      # درد قفسه سینه ⚠️ خطرناک
    SWELLING = "swelling"                          # ورم (ادم)
    LOSS_OF_APPETITE = "loss_of_appetite"          # بی‌اشتهایی
    EXCESSIVE_THIRST = "excessive_thirst"          # تشنگی زیاد
    SLEEP_DISTURBANCE = "sleep_disturbance"        # اختلال خواب
    OTHER = "other"                                # سایر


class SymptomSeverity(str, Enum):
    """شدت علامت"""
    MILD = "mild"         # خفیف
    MODERATE = "moderate" # متوسط
    SEVERE = "severe"     # شدید


class SessionEvent(str, Enum):
    """رخدادهای حین جلسه دیالیز"""
    HYPOTENSION = "hypotension"            # افت فشار
    MUSCLE_CRAMP = "muscle_cramp"          # گرفتگی عضلات
    NAUSEA_VOMITING = "nausea_vomiting"    # تهوع/استفراغ
    HEADACHE = "headache"                  # سردرد
    CHEST_PAIN = "chest_pain"              # درد قفسه سینه
    ACCESS_PROBLEM = "access_problem"      # مشکل در محل دسترسی
    ARRHYTHMIA = "arrhythmia"             # آریتمی
    ALLERGIC_REACTION = "allergic_reaction" # واکنش آلرژیک
    OTHER = "other"                        # سایر


class LabTestCode(str, Enum):
    """کدهای استاندارد آزمایش‌های مورد استفاده"""
    # الکترولیت‌ها
    POTASSIUM = "K"
    SODIUM = "Na"
    CALCIUM = "Ca"
    PHOSPHORUS = "P"
    BICARBONATE = "HCO3"

    # خون و کم‌خونی
    HEMOGLOBIN = "Hb"
    HEMATOCRIT = "Hct"

    # آهن
    FERRITIN = "Ferritin"
    TSAT = "TSAT"

    # تغذیه
    ALBUMIN = "Alb"

    # التهاب
    CRP = "CRP"

    # هورمون پاراتیروئید
    PTH = "PTH"

    # عملکرد کلیه / پاکسازی
    UREA = "Urea"
    CREATININE = "Cr"

    # لیپید (اختیاری)
    CHOLESTEROL = "Chol"
    TRIGLYCERIDE = "TG"


class DietAdherence(str, Enum):
    """سطح رعایت رژیم غذایی"""
    GOOD = "good"         # خوب
    MODERATE = "moderate" # متوسط
    POOR = "poor"         # ضعیف


class TrendDirection(str, Enum):
    """جهت روند تغییرات"""
    INCREASING = "increasing"   # افزایشی
    DECREASING = "decreasing"   # کاهشی
    STABLE = "stable"           # پایدار


class VascularAccessType(str, Enum):
    """نوع دسترسی عروقی"""
    FISTULA = "fistula"       # فیستول شریانی-وریدی
    GRAFT = "graft"           # گرافت
    CATHETER = "catheter"     # کاتتر


class Gender(str, Enum):
    """جنسیت"""
    MALE = "male"
    FEMALE = "female"


class AbnormalityDirection(str, Enum):
    """جهت انحراف از مقدار نرمال"""
    HIGH = "high"
    LOW = "low"


# ==========================================
# علائمی که خطر فوری دارند
# ==========================================
DANGER_SYMPTOMS = {
    SymptomType.CHEST_PAIN,
    SymptomType.SHORTNESS_OF_BREATH,
}

DANGER_SYMPTOM_SEVERITY = {
    SymptomSeverity.SEVERE,
}