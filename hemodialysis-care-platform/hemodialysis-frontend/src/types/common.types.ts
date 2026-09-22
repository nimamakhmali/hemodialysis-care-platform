// ═══════════════════════════════════════════════════════════════════════
// COMMON TYPES — سیستم همودیالیز
// ═══════════════════════════════════════════════════════════════════════

// ─── User & Auth ────────────────────────────────────────────────────────
export type UserRole = 'patient' | 'clinician' | 'admin'

export type TrendDirection = 'increasing' | 'decreasing' | 'stable'

export type HealthStatus = 'ok' | 'warning' | 'critical' | 'neutral' | 'unknown'

// ─── Alert ──────────────────────────────────────────────────────────────
export type AlertSeverity = 'low' | 'medium' | 'high'

export type AlertStatus = 'new' | 'acknowledged' | 'resolved'

export type AlertCategory =
  | 'weight'
  | 'blood_pressure'
  | 'lab'
  | 'symptom'
  | 'fluid'
  | 'diet'
  | 'combined'
  | 'session'

// ─── Recommendation ─────────────────────────────────────────────────────
export type RecommendationStatus = 'draft' | 'approved' | 'edited' | 'rejected'

// ─── Symptom — دقیقاً مطابق app/shared/enums.py ─────────────────────────
export type SymptomType =
  | 'shortness_of_breath'
  | 'dizziness'
  | 'access_site_pain'
  | 'muscle_cramp'
  | 'nausea'
  | 'vomiting'
  | 'itching'
  | 'headache'
  | 'fatigue'
  | 'chest_pain'
  | 'swelling'
  | 'loss_of_appetite'
  | 'excessive_thirst'
  | 'sleep_disturbance'
  | 'other'

export type SymptomSeverity = 'mild' | 'moderate' | 'severe'

// ─── Diet ───────────────────────────────────────────────────────────────
export type DietAdherence = 'good' | 'moderate' | 'poor'

// ─── Lab — دقیقاً مطابق app/shared/enums.py ─────────────────────────────
export type LabTestCode =
  | 'K'
  | 'Na'
  | 'Ca'
  | 'P'
  | 'HCO3'
  | 'Hb'
  | 'Hct'
  | 'Ferritin'
  | 'TSAT'
  | 'Alb'
  | 'CRP'
  | 'PTH'
  | 'Urea'
  | 'Cr'
  | 'Chol'
  | 'TG'

// ─── Session Events — دقیقاً مطابق app/shared/enums.py ──────────────────
export type SessionEvent =
  | 'hypotension'
  | 'muscle_cramp'
  | 'nausea_vomiting'
  | 'headache'
  | 'chest_pain'
  | 'access_problem'
  | 'arrhythmia'
  | 'allergic_reaction'
  | 'other'

// ─── Vascular Access ────────────────────────────────────────────────────
export type VascularAccessType = 'fistula' | 'graft' | 'catheter'

// ─── Gender ─────────────────────────────────────────────────────────────
export type Gender = 'male' | 'female'

// ─── Trend Result — snake_case مطابق پاسخ واقعی بک‌اند ─────────────────
export interface TrendResult {
  direction: TrendDirection
  slope: number
  is_concerning: boolean
  interpretation_fa: string
  values: number[]
  dates: string[]
  change_percent?: number
}

// ─── Risk Score ─────────────────────────────────────────────────────────
export interface RiskScore {
  score: number
  level: AlertSeverity
  contributing_factors: Array<{
    factor: string
    contribution: number
    detail: string
  }>
  interpretation_fa: string
  calculated_at: string
}

// ─── Pagination ─────────────────────────────────────────────────────────
export interface PaginationParams {
  page?: number
  size?: number
}

export interface PaginationMeta {
  total: number
  page: number
  size: number
  pages: number
}

// ─── Filter ─────────────────────────────────────────────────────────────
export interface DateRangeFilter {
  dateFrom?: string
  dateTo?: string
}

// ─── Chart Data ─────────────────────────────────────────────────────────
export interface ChartDataPoint {
  date: string
  dateFa: string
  [key: string]: string | number | null | undefined
}

// ─── Weight ─────────────────────────────────────────────────────────────
export interface IDWGResult {
  kg: number
  percent: number
  status: HealthStatus
  label: string
}

// ─── BP ─────────────────────────────────────────────────────────────────
export interface BPReading {
  systolic: number
  diastolic: number
}

export interface BPStatus {
  status: HealthStatus
  label: string
  map: number
}

// ─── Lab Reference ──────────────────────────────────────────────────────
export interface LabReferenceRange {
  test_code: LabTestCode
  unit: string
  normal_low: number
  normal_high: number
  critical_low?: number
  critical_high?: number
  valid_min: number
  valid_max: number
  description_fa: string
}

// ─── Select Option ──────────────────────────────────────────────────────
export interface SelectOption<T = string> {
  value: T
  label: string
  disabled?: boolean
  description?: string
}

// ─── Toast ──────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  type: ToastType
  title: string
  description?: string
  duration?: number
}

// ─── Navigation (تعریف واحد) ─────────────────────────────────────────────
export interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string; size?: number }>
  badge?: string | number
  badgeVariant?: 'default' | 'danger' | 'warning'
  description?: string
  children?: NavItem[]
}

// ─── Table Column ───────────────────────────────────────────────────────
export interface TableColumn<T> {
  key: keyof T | string
  header: string
  render?: (value: unknown, row: T) => React.ReactNode
  width?: string
  align?: 'right' | 'left' | 'center'
  sortable?: boolean
}

// ─── Action ─────────────────────────────────────────────────────────────
export interface ActionItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger' | 'warning'
  disabled?: boolean
  description?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}