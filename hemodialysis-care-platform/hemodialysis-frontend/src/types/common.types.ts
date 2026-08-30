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
  | 'session'

// ─── Recommendation ─────────────────────────────────────────────────────
export type RecommendationStatus = 'draft' | 'approved' | 'edited' | 'rejected'

// ─── Symptom ────────────────────────────────────────────────────────────
export type SymptomType =
  | 'shortness_of_breath'
  | 'dizziness'
  | 'access_site_pain'
  | 'muscle_cramp'
  | 'nausea'
  | 'itching'
  | 'headache'
  | 'fatigue'
  | 'chest_pain'
  | 'swelling'

export type SymptomSeverity = 'mild' | 'moderate' | 'severe'

// ─── Diet ───────────────────────────────────────────────────────────────
export type DietAdherence = 'good' | 'moderate' | 'poor'

// ─── Lab ────────────────────────────────────────────────────────────────
export type LabTestCode =
  | 'K'
  | 'Na'
  | 'Ca'
  | 'P'
  | 'Hb'
  | 'Hct'
  | 'Alb'
  | 'CRP'
  | 'Ferritin'
  | 'TSAT'
  | 'PTH'
  | 'Urea'
  | 'Cr'

// ─── Session Events ──────────────────────────────────────────────────────
export type SessionEvent =
  | 'hypotension'
  | 'muscle_cramp'
  | 'nausea_vomiting'
  | 'headache'
  | 'chest_pain'
  | 'access_problem'
  | 'other'

// ─── Vascular Access ────────────────────────────────────────────────────
export type VascularAccessType = 'fistula' | 'graft' | 'catheter'

// ─── Gender ─────────────────────────────────────────────────────────────
export type Gender = 'male' | 'female'

// ─── Trend Result ───────────────────────────────────────────────────────
export interface TrendResult {
  direction: TrendDirection
  slope: number
  isConcerning: boolean
  interpretationFa: string
  values: number[]
  dates: string[]
  changePercent: number
}





// ─── Risk Score ─────────────────────────────────────────────────────────
export interface RiskScore {
  score: number
  level: AlertSeverity
  contributingFactors: Array<{
    factor: string
    contribution: number
    detail: string
  }>
  interpretationFa: string
  calculatedAt: string
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
  testCode: LabTestCode
  unit: string
  normalLow: number
  normalHigh: number
  criticalLow?: number
  criticalHigh?: number
  validMin: number
  validMax: number
  descriptionFa: string
}

// ─── Select Option ──────────────────────────────────────────────────────
export interface SelectOption<T = string> {
  value: T
  label: string
  disabled?: boolean
  description?: string
  icon?: React.ReactNode
}

// ─── Toast ──────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  type: ToastType
  title: string
  description?: string
  duration?: number
}

// ─── Navigation ─────────────────────────────────────────────────────────
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



export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string}>;
  description?: string;
  badge?: string | number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
