import type { DietAdherence } from '@/types/common.types'

export interface FluidLog {
  id: string
  patient_id: string
  log_date: string
  total_ml: number
  items?: Array<{ type: string; amount_ml: number; label: string }>
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface UpsertFluidLogRequest {
  log_date: string
  total_ml: number
  items?: Array<{ type: string; amount_ml: number; label: string }>
  notes?: string
}

export interface DietLog {
  id: string
  patient_id: string
  log_date: string
  potassium_adherence: DietAdherence
  phosphorus_adherence: DietAdherence
  protein_adherence: DietAdherence
  sodium_adherence: DietAdherence
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface UpsertDietLogRequest {
  log_date: string
  potassium_adherence: DietAdherence
  phosphorus_adherence: DietAdherence
  protein_adherence: DietAdherence
  sodium_adherence: DietAdherence
  notes?: string
}

export interface DietSummaryResponse {
  last_7_days: {
    potassium_avg: string
    phosphorus_avg: string
    protein_avg: string
    sodium_avg: string
  }
  adherence_rate: number
}

export const DIET_ADHERENCE_LABELS: Record<DietAdherence, string> = {
  good: 'خوب',
  moderate: 'متوسط',
  poor: 'ضعیف',
}

export const DIET_ADHERENCE_COLORS: Record<DietAdherence, string> = {
  good: 'bg-emerald-100 text-emerald-700',
  moderate: 'bg-amber-100 text-amber-700',
  poor: 'bg-red-100 text-red-700',
}

export const DIET_CATEGORY_LABELS = {
  potassium_adherence: 'پتاسیم',
  phosphorus_adherence: 'فسفر',
  protein_adherence: 'پروتئین',
  sodium_adherence: 'سدیم',
} as const