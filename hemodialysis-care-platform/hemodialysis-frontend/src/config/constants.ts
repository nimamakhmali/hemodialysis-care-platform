// ─── App ─────────────────────────────────────────────────────────────────
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'سامانه پایش دیالیز'
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0'

// ─── Polling ──────────────────────────────────────────────────────────────
export const POLLING_INTERVAL_MS = Number(
  process.env.NEXT_PUBLIC_POLLING_INTERVAL_MS ?? 60_000
)
export const ALERT_POLLING_MS = Number(
  process.env.NEXT_PUBLIC_ALERT_POLLING_MS ?? 30_000
)

// ─── Pagination ───────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20
export const DEFAULT_PAGE = 1

// ─── Lab Units ────────────────────────────────────────────────────────────
export const LAB_UNITS = {
  K: 'mEq/L',
  Na: 'mEq/L',
  Ca: 'mg/dL',
  P: 'mg/dL',
  Hb: 'g/dL',
  Hct: '%',
  Alb: 'g/dL',
  CRP: 'mg/L',
  Ferritin: 'ng/mL',
  TSAT: '%',
  PTH: 'pg/mL',
  Urea: 'mg/dL',
  Cr: 'mg/dL',
} as const

// ─── Lab Persian Names ────────────────────────────────────────────────────
export const LAB_NAMES_FA = {
  K: 'پتاسیم',
  Na: 'سدیم',
  Ca: 'کلسیم',
  P: 'فسفر',
  Hb: 'هموگلوبین',
  Hct: 'هماتوکریت',
  Alb: 'آلبومین',
  CRP: 'CRP',
  Ferritin: 'فریتین',
  TSAT: 'TSAT',
  PTH: 'PTH',
  Urea: 'اوره',
  Cr: 'کراتینین',
} as const

// ─── Symptom Persian Names ────────────────────────────────────────────────
export const SYMPTOM_NAMES_FA = {
  shortness_of_breath: 'تنگی نفس',
  dizziness: 'سرگیجه',
  access_site_pain: 'درد محل فیستول',
  muscle_cramp: 'کرامپ عضلانی',
  nausea: 'تهوع',
  itching: 'خارش',
  headache: 'سردرد',
  fatigue: 'ضعف و بی‌حالی',
  chest_pain: 'درد قفسه سینه',
  swelling: 'تورم',
} as const

// ─── Session Event Persian Names ──────────────────────────────────────────
export const SESSION_EVENT_NAMES_FA = {
  hypotension: 'افت فشار خون',
  muscle_cramp: 'کرامپ عضلانی',
  nausea_vomiting: 'تهوع و استفراغ',
  headache: 'سردرد',
  chest_pain: 'درد قفسه سینه',
  access_problem: 'مشکل دسترسی عروقی',
  other: 'سایر',
} as const

// ─── Alert Severity Persian Names ─────────────────────────────────────────
export const ALERT_SEVERITY_FA = {
  low: 'پایین',
  medium: 'متوسط',
  high: 'بحرانی',
} as const

// ─── Alert Category Persian Names ─────────────────────────────────────────
export const ALERT_CATEGORY_FA = {
  weight: 'وزن',
  blood_pressure: 'فشار خون',
  lab: 'آزمایش',
  symptom: 'علائم',
  fluid: 'مایعات',
  diet: 'رژیم غذایی',
  session: 'جلسه دیالیز',
} as const

// ─── User Role Persian Names ──────────────────────────────────────────────
export const USER_ROLE_FA = {
  patient: 'بیمار',
  clinician: 'پزشک / پرستار',
  admin: 'مدیر سیستم',
} as const

// ─── Vascular Access Persian Names ───────────────────────────────────────
export const VASCULAR_ACCESS_FA = {
  fistula: 'فیستول',
  graft: 'گرافت',
  catheter: 'کاتتر',
} as const

// ─── Diet Adherence Persian Names ─────────────────────────────────────────
export const DIET_ADHERENCE_FA = {
  good: 'خوب رعایت کردم',
  moderate: 'تقریباً رعایت کردم',
  poor: 'رعایت نکردم',
} as const

// ─── Trend Direction Persian Names ────────────────────────────────────────
export const TREND_DIRECTION_FA = {
  increasing: 'صعودی',
  decreasing: 'نزولی',
  stable: 'پایدار',
} as const

// ─── Health Status Labels ─────────────────────────────────────────────────
export const HEALTH_STATUS_FA = {
  ok: 'طبیعی',
  warning: 'هشدار',
  critical: 'بحرانی',
  neutral: 'نامشخص',
  unknown: 'نامشخص',
} as const

// ─── Symptom Severity Persian Names ──────────────────────────────────────
export const SYMPTOM_SEVERITY_FA = {
  mild: 'ملایم',
  moderate: 'متوسط',
  severe: 'شدید',
} as const

// ─── Recommendation Status Persian Names ──────────────────────────────────
export const RECOMMENDATION_STATUS_FA = {
  draft: 'پیش‌نویس',
  approved: 'تأیید شده',
  edited: 'ویرایش شده',
  rejected: 'رد شده',
} as const

// ─── Fluid Quick Items ────────────────────────────────────────────────────
export const FLUID_QUICK_ITEMS = [
  { type: 'water', label: 'آب', defaultMl: 200, emoji: '💧' },
  { type: 'tea', label: 'چای', defaultMl: 150, emoji: '🍵' },
  { type: 'soup', label: 'سوپ', defaultMl: 300, emoji: '🥣' },
  { type: 'juice', label: 'آبمیوه', defaultMl: 200, emoji: '🧃' },
  { type: 'milk', label: 'شیر', defaultMl: 200, emoji: '🥛' },
  { type: 'other', label: 'سایر', defaultMl: 100, emoji: '🫗' },
] as const

// ─── IDWG Thresholds ──────────────────────────────────────────────────────
export const IDWG_THRESHOLDS = {
  warningPercent: 3.0,
  criticalPercent: 5.0,
} as const

// ─── Chart Colors ─────────────────────────────────────────────────────────
export const CHART_COLORS = {
  primary: '#0EA5E9',
  secondary: '#06B6D4',
  accent: '#14B8A6',
  warning: '#F59E0B',
  danger: '#EF4444',
  success: '#22C55E',
  info: '#3B82F6',
  neutral: '#94A3B8',
  dryWeight: '#7DD3FC',
} as const