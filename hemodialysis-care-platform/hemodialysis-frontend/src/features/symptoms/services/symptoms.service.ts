// مطابق کامل با app/shared/enums.py

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

export interface SymptomEntry {
  type: SymptomType
  severity: SymptomSeverity
}

export interface SymptomReport {
  id: string
  patient_id: string
  reported_at: string
  symptoms: SymptomEntry[]
  notes?: string | null
  related_session_id?: string | null
  created_at: string
}

export interface CreateSymptomReportRequest {
  reported_at?: string
  symptoms: SymptomEntry[]
  notes?: string
  related_session_id?: string
}

export interface SymptomSummaryResponse {
  frequency: Partial<Record<SymptomType, number>>
  most_common: SymptomType[]
  recent_danger_symptoms: boolean
}

export const SYMPTOM_LABELS: Record<SymptomType, string> = {
  shortness_of_breath: 'تنگی نفس',
  dizziness: 'سرگیجه',
  access_site_pain: 'درد محل فیستول',
  muscle_cramp: 'کرامپ عضلانی',
  nausea: 'تهوع',
  vomiting: 'استفراغ',
  itching: 'خارش',
  headache: 'سردرد',
  fatigue: 'ضعف و بی‌حالی',
  chest_pain: 'درد قفسه سینه',
  swelling: 'تورم',
  loss_of_appetite: 'بی‌اشتهایی',
  excessive_thirst: 'تشنگی زیاد',
  sleep_disturbance: 'اختلال خواب',
  other: 'سایر',
}

export const SEVERITY_LABELS: Record<SymptomSeverity, string> = {
  mild: 'خفیف',
  moderate: 'متوسط',
  severe: 'شدید',
}

export const SEVERITY_COLORS: Record<SymptomSeverity, string> = {
  mild: 'bg-emerald-100 text-emerald-700',
  moderate: 'bg-amber-100 text-amber-700',
  severe: 'bg-red-100 text-red-700',
}

// مطابق با DANGER_SYMPTOMS در app/shared/enums.py
export const DANGER_SYMPTOMS = new Set<SymptomType>([
  'chest_pain',
  'shortness_of_breath',
])