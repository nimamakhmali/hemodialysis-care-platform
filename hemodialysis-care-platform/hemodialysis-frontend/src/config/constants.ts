import type { UserRole, LabTestCode, TrendDirection } from '@/types/common.types'

export const USER_ROLE_FA: Record<UserRole, string> = {
  patient: 'بیمار',
  clinician: 'کلینیسین',
  admin: 'مدیر سیستم',
}

export const APP_NAME = 'سامانه دیالیز'

export const TOKEN_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
} as const

// ── Lab Names (برای LabTrendChart) ─────────────────────────────────────────
export const LAB_NAMES_FA: Partial<Record<LabTestCode, string>> = {
  K: 'پتاسیم',
  Na: 'سدیم',
  Ca: 'کلسیم',
  P: 'فسفر',
  HCO3: 'بیکربنات',
  Hb: 'هموگلوبین',
  Hct: 'هماتوکریت',
  Ferritin: 'فریتین',
  TSAT: 'اشباع ترانسفرین',
  Alb: 'آلبومین',
  CRP: 'CRP',
  PTH: 'PTH',
  Urea: 'اوره',
  Cr: 'کراتینین',
  Chol: 'کلسترول',
  TG: 'تری‌گلیسرید',
}

export const LAB_UNITS: Partial<Record<LabTestCode, string>> = {
  K: 'mEq/L',
  Na: 'mEq/L',
  Ca: 'mg/dL',
  P: 'mg/dL',
  HCO3: 'mEq/L',
  Hb: 'g/dL',
  Hct: '%',
  Ferritin: 'ng/mL',
  TSAT: '%',
  Alb: 'g/dL',
  CRP: 'mg/L',
  PTH: 'pg/mL',
  Urea: 'mg/dL',
  Cr: 'mg/dL',
  Chol: 'mg/dL',
  TG: 'mg/dL',
}

// برای LabTrendChart
export const CHART_COLORS = {
  primary: '#0EA5E9',
  secondary: '#06B6D4',
  teal: '#14B8A6',
  warning: '#F59E0B',
  danger: '#EF4444',
  success: '#22C55E',
}

export const TREND_DIRECTION_FA: Record<TrendDirection, string> = {
  increasing: 'صعودی',
  decreasing: 'نزولی',
  stable: 'پایدار',
}

// Alert severity display
export const ALERT_SEVERITY_COLORS = {
  low: {
    bg: 'bg-blue-50', text: 'text-blue-700',
    border: 'border-blue-200', dot: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800',
  },
  medium: {
    bg: 'bg-amber-50', text: 'text-amber-700',
    border: 'border-amber-200', dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800',
  },
  high: {
    bg: 'bg-red-50', text: 'text-red-700',
    border: 'border-red-200', dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-800',
  },
} as const