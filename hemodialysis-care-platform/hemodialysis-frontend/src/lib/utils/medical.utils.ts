import type { HealthStatus, AlertSeverity, IDWGResult, BPStatus } from '@appTypes/common.types'
import { IDWG_THRESHOLDS } from '@config/constants'

// ─── IDWG ────────────────────────────────────────────────────────────────────
export function calculateIDWG(
  preWeight: number,
  dryWeight: number
): IDWGResult {
  const kg = preWeight - dryWeight
  const percent = dryWeight > 0 ? (kg / dryWeight) * 100 : 0

  let status: HealthStatus
  let label: string

  if (percent < 0) {
    status = 'ok'
    label = 'کمتر از وزن خشک'
  } else if (percent < IDWG_THRESHOLDS.warningPercent) {
    status = 'ok'
    label = 'در محدوده مناسب'
  } else if (percent < IDWG_THRESHOLDS.criticalPercent) {
    status = 'warning'
    label = 'بیشتر از حد توصیه‌شده'
  } else {
    status = 'critical'
    label = 'خارج از محدوده ایمن'
  }

  return { kg, percent, status, label }
}

// ─── Blood Pressure ───────────────────────────────────────────────────────────
export function getBPStatus(
  systolic: number | null | undefined,
  diastolic: number | null | undefined
): BPStatus {
  if (!systolic || !diastolic) {
    return { status: 'unknown', label: 'ثبت نشده', map: 0 }
  }

  const map = Math.round(diastolic + (systolic - diastolic) / 3)

  if (systolic >= 180 || systolic < 80) {
    return { status: 'critical', label: 'بحرانی', map }
  }
  if (systolic >= 160 || systolic < 90) {
    return { status: 'warning', label: 'غیرطبیعی', map }
  }
  return { status: 'ok', label: 'طبیعی', map }
}

export function detectIDH(
  preSystolic: number | null | undefined,
  duringSystolic: number | null | undefined
): boolean {
  if (!preSystolic || !duringSystolic) return false
  return duringSystolic < 90 || preSystolic - duringSystolic > 20
}

// ─── Lab Status ───────────────────────────────────────────────────────────────
export function getLabStatus(
  value: number,
  normalLow: number,
  normalHigh: number,
  criticalLow?: number,
  criticalHigh?: number
): HealthStatus {
  if (criticalLow !== undefined && value < criticalLow) return 'critical'
  if (criticalHigh !== undefined && value > criticalHigh) return 'critical'
  if (value < normalLow || value > normalHigh) return 'warning'
  return 'ok'
}

// ─── Alert Severity ───────────────────────────────────────────────────────────
export function getSeverityClasses(severity: AlertSeverity): {
  badge: string
  card: string
  icon: string
  text: string
  border: string
} {
  const map = {
    high: {
      badge: 'bg-danger-light text-danger-dark border-danger-border',
      card: 'bg-danger-light/40 border-danger-border',
      icon: 'text-danger',
      text: 'text-danger-dark',
      border: 'border-r-4 border-danger',
    },
    medium: {
      badge: 'bg-warning-light text-warning-dark border-warning-border',
      card: 'bg-warning-light/40 border-warning-border',
      icon: 'text-warning',
      text: 'text-warning-dark',
      border: 'border-r-4 border-warning',
    },
    low: {
      badge: 'bg-info-light text-info-dark border-info-border',
      card: 'bg-info-light/40 border-info-border',
      icon: 'text-info',
      text: 'text-info-dark',
      border: 'border-r-4 border-info',
    },
  }
  return map[severity]
}

export function getSeverityLabel(severity: AlertSeverity): string {
  return { high: 'بحرانی', medium: 'متوسط', low: 'پایین' }[severity]
}

export function getStatusLabel(status: HealthStatus): string {
  return {
    ok: 'طبیعی',
    warning: 'هشدار',
    critical: 'بحرانی',
    neutral: 'نامشخص',
    unknown: 'نامشخص',
  }[status]
}

export function getStatusClasses(status: HealthStatus): string {
  return {
    ok: 'text-success-dark bg-success-light border-success-border',
    warning: 'text-warning-dark bg-warning-light border-warning-border',
    critical: 'text-danger-dark bg-danger-light border-danger-border',
    neutral: 'text-primary-700 bg-primary-50 border-primary-200',
    unknown: 'text-text-muted bg-surface border-border-subtle',
  }[status]
}

// ─── Risk Score ────────────────────────────────────────────────────────────────
export function getRiskLevel(score: number): AlertSeverity {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

export function getRiskLabel(score: number): string {
  if (score >= 70) return 'ریسک بالا'
  if (score >= 40) return 'ریسک متوسط'
  return 'ریسک پایین'
}

// ─── Symptom Danger Check ─────────────────────────────────────────────────────
const DANGER_SYMPTOMS = new Set(['chest_pain', 'shortness_of_breath'])

export function hasDangerSymptoms(
  symptoms: Array<{ type: string; severity: string }>
): boolean {
  return symptoms.some(
    (s) => DANGER_SYMPTOMS.has(s.type) && s.severity === 'severe'
  )
}

// ─── UF Volume ────────────────────────────────────────────────────────────────
export function calculateUFVolume(
  preWeight: number,
  postWeight: number | null | undefined
): number | null {
  if (!postWeight) return null
  return Math.max(0, preWeight - postWeight)
}


export const SESSION_EVENTS_FA: Record<string, string> = {
  hypotension: 'افت فشار خون',
  muscle_cramp: 'گرفتگی عضلات',
  nausea_vomiting: 'تهوع/استفراغ',
  headache: 'سردرد',
  chest_pain: 'درد قفسه سینه',
  access_problem: 'مشکل دسترسی عروقی',
  other: 'سایر',
}

// src/lib/utils/medical.utils.ts



export function getSeverityColor(severity: AlertSeverity) {
  return {
    high: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      badge: "bg-red-100 text-red-700",
      dot: "bg-red-500",
      ring: "ring-red-500/30",
    },
    medium: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      badge: "bg-amber-100 text-amber-700",
      dot: "bg-amber-500",
      ring: "ring-amber-500/30",
    },
    low: {
      bg: "bg-sky-50",
      border: "border-sky-200",
      text: "text-sky-700",
      badge: "bg-sky-100 text-sky-700",
      dot: "bg-sky-400",
      ring: "ring-sky-400/30",
    },
  }[severity];
}


export function getRiskLevelLabel(level: "low" | "medium" | "high") {
  return { low: "کم", medium: "متوسط", high: "زیاد" }[level];
}

export function getRiskLevelColor(level: "low" | "medium" | "high") {
  return {
    low: "text-emerald-600",
    medium: "text-amber-600",
    high: "text-red-600",
  }[level];
}

export function formatBP(systolic?: number | null, diastolic?: number | null) {
  if (!systolic || !diastolic) return "—";
  return `${systolic}/${diastolic}`;
}

export function formatWeight(value?: number | null, unit = "kg") {
  if (value == null) return "—";
  return `${value.toFixed(1)} ${unit}`;
}

export function formatPercent(value?: number | null) {
  if (value == null) return "—";
  return `${value.toFixed(1)}٪`;
}