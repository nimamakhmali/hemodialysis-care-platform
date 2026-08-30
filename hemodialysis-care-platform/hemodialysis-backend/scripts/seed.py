"""
Seed داده‌های اولیه سیستم

این اسکریپت:
1. محدوده‌های مرجع آزمایش‌ها را ایجاد می‌کند
2. محتوای آموزشی پایه را ایجاد می‌کند
3. کاربر ادمین اول را ایجاد می‌کند (اگر نباشد)
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.config.database import SessionLocal, engine
from app.models import (
    LabReferenceRange, EducationContent, User, AuditLog
)
from app.infrastructure.db.base import BaseModel
from app.shared.enums import UserRole


def seed_lab_reference_ranges(db: Session) -> None:
    """ایجاد محدوده‌های مرجع آزمایش‌ها"""

    reference_data = [
        {
            "test_code": "K",
            "name_fa": "پتاسیم",
            "unit": "mEq/L",
            "normal_low": 3.5,
            "normal_high": 5.0,
            "warning_low": 3.5,
            "warning_high": 5.5,
            "critical_low": 3.0,
            "critical_high": 6.0,
            "valid_min": 1.0,
            "valid_max": 10.0,
            "description": (
                "پتاسیم مهم‌ترین الکترولیت در بیماران دیالیزی است. "
                "مقادیر بالای ۶ با ریسک آریتمی قلبی همراه است."
            ),
        },
        {
            "test_code": "Na",
            "name_fa": "سدیم",
            "unit": "mEq/L",
            "normal_low": 135.0,
            "normal_high": 145.0,
            "warning_low": 130.0,
            "warning_high": 150.0,
            "critical_low": 125.0,
            "critical_high": 155.0,
            "valid_min": 110.0,
            "valid_max": 170.0,
            "description": "کنترل سدیم در مدیریت تشنگی و مصرف مایعات نقش دارد.",
        },
        {
            "test_code": "Ca",
            "name_fa": "کلسیم",
            "unit": "mg/dL",
            "normal_low": 8.5,
            "normal_high": 10.5,
            "warning_low": 8.0,
            "warning_high": 10.5,
            "critical_low": 7.0,
            "critical_high": 12.0,
            "valid_min": 4.0,
            "valid_max": 16.0,
            "description": "کلسیم در کنترل استخوان و بیماری کلیه-معدنی نقش دارد.",
        },
        {
            "test_code": "P",
            "name_fa": "فسفر",
            "unit": "mg/dL",
            "normal_low": 2.5,
            "normal_high": 4.5,
            "warning_low": 2.5,
            "warning_high": 5.5,
            "critical_low": 1.5,
            "critical_high": 7.0,
            "valid_min": 0.5,
            "valid_max": 15.0,
            "description": (
                "هدف در بیماران دیالیزی ۳.۵-۵.۵ mg/dL. "
                "فسفر بالا با خارش، بیماری استخوان و ریسک قلبی همراه است."
            ),
        },
        {
            "test_code": "HCO3",
            "name_fa": "بی‌کربنات",
            "unit": "mEq/L",
            "normal_low": 22.0,
            "normal_high": 26.0,
            "warning_low": 18.0,
            "warning_high": 28.0,
            "critical_low": 15.0,
            "critical_high": None,
            "valid_min": 5.0,
            "valid_max": 45.0,
            "description": "شاخص اسیدوز متابولیک. هدف در دیالیز: ۲۲-۲۶ mEq/L",
        },
        {
            "test_code": "Hb",
            "name_fa": "هموگلوبین",
            "unit": "g/dL",
            "normal_low": 10.0,
            "normal_high": 12.0,
            "warning_low": 10.0,
            "warning_high": None,
            "critical_low": 8.0,
            "critical_high": None,
            "valid_min": 3.0,
            "valid_max": 20.0,
            "description": (
                "هدف درمانی در بیماران دیالیزی: ۱۰-۱۲ g/dL. "
                "کم‌خونی با خستگی، کاهش کیفیت زندگی و ریسک قلبی همراه است."
            ),
        },
        {
            "test_code": "Hct",
            "name_fa": "هماتوکریت",
            "unit": "%",
            "normal_low": 30.0,
            "normal_high": 36.0,
            "warning_low": 30.0,
            "warning_high": None,
            "critical_low": 24.0,
            "critical_high": None,
            "valid_min": 10.0,
            "valid_max": 65.0,
            "description": "هدف درمانی: ۳۰-۳۶٪",
        },
        {
            "test_code": "Ferritin",
            "name_fa": "فریتین",
            "unit": "ng/mL",
            "normal_low": 200.0,
            "normal_high": 800.0,
            "warning_low": 100.0,
            "warning_high": 1000.0,
            "critical_low": 50.0,
            "critical_high": None,
            "valid_min": 1.0,
            "valid_max": 5000.0,
            "description": (
                "شاخص ذخیره آهن. هدف در دیالیز: ۲۰۰-۸۰۰ ng/mL. "
                "فریتین بالا ممکن است نشانه التهاب باشد."
            ),
        },
        {
            "test_code": "TSAT",
            "name_fa": "اشباع ترانسفرین",
            "unit": "%",
            "normal_low": 20.0,
            "normal_high": 50.0,
            "warning_low": 20.0,
            "warning_high": None,
            "critical_low": 15.0,
            "critical_high": None,
            "valid_min": 1.0,
            "valid_max": 100.0,
            "description": (
                "شاخص دسترسی کارکردی آهن. "
                "هدف: بالای ۲۰٪. کمتر از ۱۵٪ نیاز به آهن درمانی دارد."
            ),
        },
        {
            "test_code": "Alb",
            "name_fa": "آلبومین",
            "unit": "g/dL",
            "normal_low": 3.5,
            "normal_high": 5.0,
            "warning_low": 3.5,
            "warning_high": None,
            "critical_low": 3.0,
            "critical_high": None,
            "valid_min": 1.0,
            "valid_max": 6.0,
            "description": (
                "شاخص وضعیت تغذیه. هدف: بالای ۳.۵ g/dL. "
                "آلبومین پایین با مرگ‌ومیر بالاتر در دیالیز همراه است."
            ),
        },
        {
            "test_code": "CRP",
            "name_fa": "پروتئین واکنشی C",
            "unit": "mg/L",
            "normal_low": None,
            "normal_high": 5.0,
            "warning_low": None,
            "warning_high": 10.0,
            "critical_low": None,
            "critical_high": 50.0,
            "valid_min": 0.1,
            "valid_max": 500.0,
            "description": (
                "شاخص التهاب سیستمیک. CRP بالا با خطر قلبی-عروقی "
                "و کاهش پاسخ به EPO همراه است."
            ),
        },
        {
            "test_code": "PTH",
            "name_fa": "هورمون پاراتیروئید",
            "unit": "pg/mL",
            "normal_low": 150.0,
            "normal_high": 600.0,
            "warning_low": 100.0,
            "warning_high": 800.0,
            "critical_low": None,
            "critical_high": 1000.0,
            "valid_min": 1.0,
            "valid_max": 3000.0,
            "description": (
                "هدف در دیالیز: ۱۵۰-۶۰۰ pg/mL (KDIGO). "
                "PTH بالا با بیماری استخوان و ریسک قلبی همراه است."
            ),
        },
        {
            "test_code": "Urea",
            "name_fa": "اوره",
            "unit": "mg/dL",
            "normal_low": None,
            "normal_high": None,
            "warning_low": None,
            "warning_high": None,
            "critical_low": None,
            "critical_high": None,
            "valid_min": 10.0,
            "valid_max": 500.0,
            "description": "شاخص پاکسازی سموم نیتروژنی. در تحلیل Kt/V استفاده می‌شود.",
        },
        {
            "test_code": "Cr",
            "name_fa": "کراتینین",
            "unit": "mg/dL",
            "normal_low": None,
            "normal_high": None,
            "warning_low": None,
            "warning_high": None,
            "critical_low": None,
            "critical_high": None,
            "valid_min": 0.1,
            "valid_max": 50.0,
            "description": "در بیماران دیالیزی مقادیر بالا طبیعی است.",
        },
    ]

    count = 0
    for data in reference_data:
        existing = db.query(LabReferenceRange).filter(
            LabReferenceRange.test_code == data["test_code"]
        ).first()

        if not existing:
            ref = LabReferenceRange(**data)
            db.add(ref)
            count += 1
            print(f"  ✅ آزمایش {data['test_code']} ({data['name_fa']}) اضافه شد")
        else:
            print(f"  ⏭️  آزمایش {data['test_code']} از قبل وجود دارد")

    db.commit()
    print(f"\n📊 {count} محدوده مرجع آزمایش ایجاد شد")


def seed_education_contents(db: Session) -> None:
    """ایجاد محتوای آموزشی پایه"""

    education_data = [
        {
            "topic_code": "HIGH_K",
            "title_fa": "پتاسیم خون شما بالاست",
            "category": "diet",
            "tags": ["potassium", "diet", "lab"],
            "display_priority": 1,
            "summary_fa": (
                "پتاسیم خون شما از حد مجاز بالاتر است. "
                "رعایت رژیم غذایی ضروری است."
            ),
            "content_fa": """
پتاسیم خون شما در آزمایش اخیر بالاتر از حد مجاز بوده است.

🔴 چرا پتاسیم بالا خطرناک است؟
پتاسیم زیاد در خون می‌تواند باعث اختلال در ضربان قلب شود.

✅ غذاهایی که باید کمتر بخورید:
• موز، خرما، کیوی، آووکادو
• سیب‌زمینی، گوجه‌فرنگی، اسفناج
• آجیل و دانه‌ها
• شکلات و کاکائو
• آب‌میوه و نوشیدنی‌های میوه‌ای

✅ راه‌های کاهش پتاسیم سبزیجات:
• پوست بگیرید و برش بزنید
• در آب فراوان خیس کنید (۲-۴ ساعت)
• آب را بریزید و با آب تازه بپزید

⚠️ اگر احساس ضعف عضلانی، تپش قلب یا بی‌حسی کردید، فوری با تیم درمان تماس بگیرید.
""",
            "trigger_conditions": {
                "lab_code": "K",
                "direction": "high",
                "threshold": 5.5,
            },
        },
        {
            "topic_code": "LOW_K",
            "title_fa": "پتاسیم خون شما پایین است",
            "category": "diet",
            "tags": ["potassium", "diet", "lab"],
            "display_priority": 1,
            "summary_fa": "پتاسیم خون شما پایین‌تر از حد نرمال است.",
            "content_fa": """
پتاسیم خون شما در آزمایش اخیر کمتر از حد نرمال بوده است.

⚠️ علائم پتاسیم پایین:
• ضعف و گرفتگی عضلات
• خستگی
• یبوست

✅ با نظر تیم درمان ممکن است نیاز به تنظیم رژیم غذایی داشته باشید.

⚠️ هرگز بدون تجویز پزشک مکمل پتاسیم مصرف نکنید.
""",
            "trigger_conditions": {
                "lab_code": "K",
                "direction": "low",
                "threshold": 3.5,
            },
        },
        {
            "topic_code": "HIGH_P",
            "title_fa": "فسفر خون شما بالاست",
            "category": "diet",
            "tags": ["phosphorus", "diet", "lab", "medication"],
            "display_priority": 1,
            "summary_fa": (
                "فسفر خون شما بالا است. "
                "رژیم غذایی و مصرف دارو را جدی بگیرید."
            ),
            "content_fa": """
فسفر خون شما در آزمایش اخیر بالاتر از حد مجاز بوده است.

🔴 چرا فسفر بالا مضر است؟
فسفر زیاد می‌تواند کلسیم را از استخوان‌ها بگیرد و باعث ضعیف شدن استخوان‌ها و خارش پوست شود.

✅ غذاهایی که باید کمتر بخورید:
• لبنیات: شیر، ماست، پنیر
• آجیل و حبوبات
• غذاهای فرآوری‌شده و کنسرو
• نوشابه (خصوصاً نوشابه‌های تیره)
• جوانه گندم و سبوس

💊 داروی فسفات‌بایندر:
• این دارو باید دقیقاً همراه با غذا مصرف شود
• قبل یا بعد از غذا اثر ندارد
• برای هر وعده غذایی (حتی میان‌وعده بزرگ) باید مصرف کنید

⚠️ اگر خارش شدید داشتید با تیم درمان مشورت کنید.
""",
            "trigger_conditions": {
                "lab_code": "P",
                "direction": "high",
                "threshold": 5.5,
            },
        },
        {
            "topic_code": "LOW_HB",
            "title_fa": "کم‌خونی — هموگلوبین شما پایین است",
            "category": "lab",
            "tags": ["hemoglobin", "anemia", "lab", "fatigue"],
            "display_priority": 2,
            "summary_fa": "هموگلوبین شما پایین‌تر از هدف درمانی است.",
            "content_fa": """
هموگلوبین (Hb) شما در آزمایش اخیر کمتر از ۱۰ g/dL بوده است.

😴 علائم کم‌خونی که ممکن است حس کنید:
• خستگی زیاد
• تنگی نفس هنگام فعالیت
• رنگ‌پریدگی
• سردرد
• ضعف عمومی

✅ چه باید بکنید؟
تیم درمان شما این موضوع را بررسی می‌کند. ممکن است نیاز به:
• تنظیم دوز داروهای کم‌خونی (EPO)
• بررسی وضعیت آهن بدن
• بررسی علت کم‌خونی

🍖 برای بهبود ذخیره آهن:
• گوشت قرمز با حجم مناسب (طبق دستور تیم درمان)
• مصرف غذاهای حاوی ویتامین C همراه با منابع آهن

⚠️ اگر تنگی نفس شدید، درد قفسه سینه یا بی‌هوشی داشتید فوراً مراجعه کنید.
""",
            "trigger_conditions": {
                "lab_code": "Hb",
                "direction": "low",
                "threshold": 10.0,
            },
        },
        {
            "topic_code": "HIGH_IDWG",
            "title_fa": "افزایش وزن زیاد بین جلسات دیالیز",
            "category": "fluid",
            "tags": ["fluid", "weight", "idwg", "diet"],
            "display_priority": 1,
            "summary_fa": (
                "وزن شما بین دو جلسه دیالیز بیش از حد مجاز افزایش یافته."
            ),
            "content_fa": """
وزن شما بین دو جلسه دیالیز بیش از حد توصیه‌شده افزایش یافته است.

💧 این یعنی چی؟
بدن شما مایعات اضافی دارد که باید در جلسه دیالیز خارج شود.
اضافه مایعات زیاد می‌تواند باعث تنگی نفس، فشار خون بالا و فشار روی قلب شود.

✅ نکات مهم برای کنترل مایعات:

1. محدودیت مایعات روزانه را جدی بگیرید
   • هر روز مقدار مشخص‌شده توسط تیم درمان را رعایت کنید

2. کاهش تشنگی:
   • آدامس بدون قند بجوید
   • یخ کوچک در دهان بگذارید
   • آب را با لیوان کوچک بنوشید
   • غذاهای خیلی شور و شیرین نخورید

3. پایش وزن روزانه:
   • هر روز صبح ناشتا وزن کنید
   • اگر وزن بیش از ۱ کیلوگرم بالا رفت، مصرف مایعات را کم کنید

⚠️ اگر تنگی نفس، ورم پا یا بی‌قراری داشتید فوراً تماس بگیرید.
""",
            "trigger_conditions": {
                "type": "idwg_percent",
                "threshold": 3.0,
            },
        },
        {
            "topic_code": "HIGH_BP",
            "title_fa": "فشار خون بالا",
            "category": "bp",
            "tags": ["blood_pressure", "hypertension", "fluid"],
            "display_priority": 2,
            "summary_fa": "فشار خون شما بالاتر از حد مطلوب است.",
            "content_fa": """
فشار خون شما در جلسه اخیر بالاتر از حد توصیه‌شده بوده است.

🩺 چرا فشار خون بالا در دیالیز مهم است؟
فشار خون بالا می‌تواند به قلب، مغز و عروق آسیب بزند.

✅ اقدامات مهم:

1. داروهای فشار خون:
   • دقیقاً طبق دستور مصرف کنید
   • هرگز خودسرانه قطع نکنید

2. کاهش نمک:
   • از نمک زدن به غذا بپرهیزید
   • غذاهای کنسروی و فرآوری‌شده کمتر بخورید

3. کنترل مایعات:
   • مایعات زیاد باعث فشار خون بالا می‌شود

4. آرامش و استراحت

⚠️ اگر سردرد شدید، تاری دید یا درد قفسه سینه داشتید فوراً مراجعه کنید.
""",
            "trigger_conditions": {
                "type": "bp_pre_systolic",
                "threshold": 160,
            },
        },
        {
            "topic_code": "LOW_BP",
            "title_fa": "فشار خون پایین",
            "category": "bp",
            "tags": ["blood_pressure", "hypotension"],
            "display_priority": 2,
            "summary_fa": "فشار خون شما پایین‌تر از حد مطلوب ثبت شده است.",
            "content_fa": """
فشار خون شما پایین‌تر از حد نرمال بوده است.

⚠️ علائمی که باید بدانید:
• سرگیجه و احساس ضعف
• تاری دید
• حالت غش

✅ چه باید بکنید:
• آرام بنشینید یا دراز بکشید
• پاها را بالا بگیرید
• به تیم درمان اطلاع دهید

اگر داروی فشار خون مصرف می‌کنید، ممکن است نیاز به تنظیم دوز باشد.
""",
            "trigger_conditions": {
                "type": "bp_pre_systolic",
                "direction": "low",
                "threshold": 100,
            },
        },
        {
            "topic_code": "IDH",
            "title_fa": "افت فشار حین دیالیز",
            "category": "bp",
            "tags": ["blood_pressure", "hypotension", "session"],
            "display_priority": 1,
            "summary_fa": "در جلسه اخیر افت فشار حین دیالیز رخ داده است.",
            "content_fa": """
در جلسه دیالیز اخیر، فشار خون شما افت کرده است.

این یکی از شایع‌ترین عوارض دیالیز است.

✅ نکاتی که کمک می‌کند:
• وزن بیش از حد بین جلسات اضافه نکنید
• قبل از دیالیز غذای سنگین نخورید
• داروهای فشار خون را طبق دستور پزشک بخورید

⚠️ اگر حین دیالیز سرگیجه، تهوع یا حالت غش داشتید فوری به پرستار بگویید.
""",
            "trigger_conditions": {
                "type": "intradialytic_hypotension",
            },
        },
        {
            "topic_code": "LOW_ALB",
            "title_fa": "آلبومین پایین — سوءتغذیه احتمالی",
            "category": "lab",
            "tags": ["albumin", "nutrition", "lab"],
            "display_priority": 2,
            "summary_fa": "آلبومین خون شما پایین است. تغذیه باید بهبود یابد.",
            "content_fa": """
آلبومین خون شما در آزمایش اخیر کمتر از حد مطلوب بوده است.

آلبومین نشان‌دهنده وضعیت تغذیه بدن است.

✅ توصیه‌های غذایی:
• پروتئین کافی بخورید: گوشت، تخم‌مرغ، ماهی
• از حذف وعده‌های غذایی بپرهیزید
• اگر بی‌اشتها هستید به تیم درمان بگویید

⚠️ آلبومین پایین با ضعف بیشتر، کند شدن بهبود زخم و ریسک بالاتر همراه است.
""",
            "trigger_conditions": {
                "lab_code": "Alb",
                "direction": "low",
                "threshold": 3.5,
            },
        },
        {
            "topic_code": "HIGH_CRP",
            "title_fa": "CRP بالا — التهاب",
            "category": "lab",
            "tags": ["crp", "inflammation", "lab"],
            "display_priority": 3,
            "summary_fa": "شاخص التهاب (CRP) در بدن شما بالا است.",
            "content_fa": """
CRP یا پروتئین واکنشی C در آزمایش شما بالا بوده است.
این نشانه وجود التهاب در بدن است.

✅ التهاب می‌تواند علل مختلفی داشته باشد:
• عفونت
• مشکل در محل دسترسی عروقی
• بیماری‌های دیگر

لطفاً هرگونه علامت عفونت (تب، قرمزی، ترشح در محل فیستول) را به تیم درمان گزارش دهید.
""",
            "trigger_conditions": {
                "lab_code": "CRP",
                "direction": "high",
                "threshold": 10.0,
            },
        },
        {
            "topic_code": "FLUID_CONTROL",
            "title_fa": "راهنمای کنترل مایعات",
            "category": "fluid",
            "tags": ["fluid", "thirst", "weight"],
            "display_priority": 3,
            "summary_fa": "راهنمای کامل کنترل مصرف مایعات در دیالیز",
            "content_fa": """
کنترل مایعات یکی از مهم‌ترین بخش‌های مراقبت از خود در دیالیز است.

💧 چقدر مایع می‌توانم بنوشم؟
معمولاً روزانه نباید بیش از ۵۰۰-۷۰۰ میلی‌لیتر به علاوه حجم ادرار روزانه‌تان مایع بنوشید.
تیم درمان شما مقدار دقیق را تعیین می‌کند.

🧊 راه‌های کاهش تشنگی:
• آدامس بدون قند بجوید
• یخ کوچک در دهان بگذارید (از سهمیه مایع کم می‌شود)
• دهان را با آب بشویید بدون اینکه بنوشید
• از غذاهای خیلی شور بپرهیزید
• در هوای گرم کمتر فعالیت کنید

📊 چه چیزهایی جزء مایع حساب می‌شوند؟
• آب، چای، قهوه، شیر، دوغ، آبمیوه
• سوپ، آش، بستنی، ماست
• میوه‌های آبدار (هندوانه، خیار)
""",
            "trigger_conditions": None,
        },
        {
            "topic_code": "PHOSPHATE_BINDER",
            "title_fa": "راهنمای مصرف فسفات‌بایندر",
            "category": "medication",
            "tags": ["phosphorus", "medication", "diet"],
            "display_priority": 2,
            "summary_fa": "نحوه صحیح مصرف داروهای فسفات‌بایندر",
            "content_fa": """
داروهای فسفات‌بایندر برای کنترل فسفر خون تجویز می‌شوند.

💊 نکات مهم مصرف:
• این دارو باید دقیقاً همراه اولین لقمه غذا مصرف شود
• قبل یا بعد از غذا بلعیدن دارو اثر ندارد
• برای هر وعده غذایی شامل میان‌وعده‌های بزرگ باید مصرف کنید

❌ اگر فراموش کردید:
• اگر هنوز مشغول خوردن هستید بخورید
• اگر وعده تمام شده، آن دوز را رد کنید و برای وعده بعدی مصرف کنید

⚠️ بدون دستور پزشک دوز را تغییر ندهید.
""",
            "trigger_conditions": {
                "lab_code": "P",
                "direction": "high",
                "threshold": 4.5,
            },
        },
        {
            "topic_code": "DIET_GENERAL",
            "title_fa": "راهنمای کلی رژیم غذایی در دیالیز",
            "category": "diet",
            "tags": ["diet", "general", "nutrition"],
            "display_priority": 5,
            "summary_fa": "اصول کلی تغذیه برای بیماران همودیالیز",
            "content_fa": """
رژیم غذایی در دیالیز چهار محدودیت اصلی دارد:

1️⃣ پتاسیم (K):
کمتر از: موز، خرما، سیب‌زمینی، گوجه، آجیل، شکلات

2️⃣ فسفر (P):
کمتر از: لبنیات، کنسرو، نوشابه، آجیل، غذاهای فرآوری‌شده

3️⃣ سدیم (نمک):
از نمک اضافه، ترشی، غذاهای شور بپرهیزید

4️⃣ مایعات:
مقدار روزانه را طبق دستور تیم درمان رعایت کنید

✅ غذاهای مناسب:
• گوشت، مرغ، ماهی (پروتئین کافی)
• برنج، نان، ماکارونی (کربوهیدرات)
• سبزیجات پخته‌شده (پتاسیم کمتری دارند)

⚠️ رژیم غذایی شما باید با تیم درمان هماهنگ شود.
""",
            "trigger_conditions": None,
        },
        {
            "topic_code": "ACCESS_CARE",
            "title_fa": "مراقبت از محل دسترسی عروقی",
            "category": "general",
            "tags": ["vascular_access", "fistula", "catheter", "care"],
            "display_priority": 4,
            "summary_fa": "نحوه مراقبت از فیستول یا کاتتر دیالیز",
            "content_fa": """
محل دسترسی عروقی (فیستول/کاتتر) قلب دیالیز شماست. از آن مراقبت کنید.

✅ مراقبت از فیستول:
• هر روز صدای جریان (thrill) را احساس کنید
• ناحیه را تمیز نگه دارید
• لباس تنگ نپوشید
• فشار روی آن نگذارید (مثلاً هنگام خواب)
• از آن برای تزریق یا خون‌گیری معمولی استفاده نکنید

⚠️ فوری به پزشک بگویید اگر:
• صدای جریان را احساس نکردید
• ناحیه قرمز، گرم یا متورم شد
• درد یا ترشح داشت
• خونریزی بند نیامد
""",
            "trigger_conditions": None,
        },
    ]

    count = 0
    for data in education_data:
        existing = db.query(EducationContent).filter(
            EducationContent.topic_code == data["topic_code"]
        ).first()

        if not existing:
            content = EducationContent(**data)
            db.add(content)
            count += 1
            print(f"  ✅ محتوای آموزشی '{data['topic_code']}' اضافه شد")
        else:
            print(f"  ⏭️  محتوای '{data['topic_code']}' از قبل وجود دارد")

    db.commit()
    print(f"\n📚 {count} محتوای آموزشی ایجاد شد")


def seed_admin_user(db: Session) -> None:
    """ایجاد کاربر ادمین پیش‌فرض (اگر هیچ ادمینی نباشد)"""
    from app.infrastructure.security.password import hash_password

    existing_admin = db.query(User).filter(
        User.role == UserRole.ADMIN
    ).first()

    if existing_admin:
        print(f"  ⏭️  ادمین از قبل وجود دارد: {existing_admin.phone_number}")
        return

    admin = User(
        phone_number="09000000000",
        full_name="مدیر سیستم",
        hashed_password=hash_password("Admin@123456"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(admin)
    db.commit()
    print(f"  ✅ ادمین پیش‌فرض ایجاد شد: 09000000000 / Admin@123456")
    print(f"  ⚠️  رمز عبور پیش‌فرض را فوراً تغییر دهید!")


def main():
    """اجرای کامل seed"""
    print("=" * 60)
    print("🌱 شروع Seed داده‌های اولیه سیستم همودیالیز")
    print("=" * 60)

    # ایجاد جداول (اگر وجود ندارد)
    from app.config.database import engine
    BaseModel.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("\n📊 ایجاد محدوده‌های مرجع آزمایش‌ها...")
        seed_lab_reference_ranges(db)

        print("\n📚 ایجاد محتوای آموزشی...")
        seed_education_contents(db)

        print("\n👤 ایجاد کاربر ادمین...")
        seed_admin_user(db)

        print("\n" + "=" * 60)
        print("✅ Seed با موفقیت انجام شد!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ خطا در Seed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()