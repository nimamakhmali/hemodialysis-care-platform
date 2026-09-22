// ── Enums ──────────────────────────────────────────────────────────────────
export type UserRole = 'patient' | 'clinician' | 'admin'
export type AlertSeverity = 'low' | 'medium' | 'high'
export type AlertCategory =
  | 'weight' | 'blood_pressure' | 'lab'
  | 'symptom' | 'fluid' | 'diet'
export type AlertStatus = 'new' | 'acknowledged' | 'resolved'
export type RecommendationStatus = 'draft' | 'approved' | 'edited' | 'rejected'
export type HealthStatus = 'ok' | 'warning' | 'critical' | 'neutral' | 'unknown'
export type TrendDirection = 'increasing' | 'decreasing' | 'stable'
export type DietAdherence = 'good' | 'moderate' | 'poor'

export type LabTestCode =
  | 'K' | 'Na' | 'Ca' | 'P' | 'HCO3'
  | 'Hb' | 'Hct' | 'Ferritin' | 'TSAT'
  | 'Alb' | 'CRP' | 'PTH' | 'Urea' | 'Cr'
  | 'Chol' | 'TG'

// مطابق app/shared/enums.py
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

// ── UI Types ───────────────────────────────────────────────────────────────
export interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  badge?: number | string
  badgeVariant?: 'default' | 'danger' | 'warning'
  exact?: boolean
}

// ── Display constants ──────────────────────────────────────────────────────
export const ALERT_SEVERITY_FA: Record<AlertSeverity, string> = {
  low: 'کم', medium: 'متوسط', high: 'بالا',
}

export const ALERT_CATEGORY_FA: Record<AlertCategory, string> = {
  weight: 'وزن', blood_pressure: 'فشار خون', lab: 'آزمایش',
  symptom: 'علائم', fluid: 'مایعات', diet: 'رژیم',
}

export const ALERT_STATUS_FA: Record<AlertStatus, string> = {
  new: 'جدید', acknowledged: 'دیده‌شده', resolved: 'بسته‌شده',
}

export const RECOMMENDATION_STATUS_FA: Record<RecommendationStatus, string> = {
  draft: 'در انتظار', approved: 'تأیید شده',
  edited: 'ویرایش شده', rejected: 'رد شده',
}

export const SESSION_EVENT_FA: Record<SessionEvent, string> = {
  hypotension: 'افت فشار خون',
  muscle_cramp: 'گرفتگی عضلانی',
  nausea_vomiting: 'تهوع/استفراغ',
  headache: 'سردرد',
  chest_pain: 'درد قفسه سینه',
  access_problem: 'مشکل دسترسی',
  arrhythmia: 'آریتمی',
  allergic_reaction: 'واکنش آلرژیک',
  other: 'سایر',
}