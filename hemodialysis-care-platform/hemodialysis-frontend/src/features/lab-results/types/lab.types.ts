import type { LabTestCode, HealthStatus, TrendDirection } from '@/types/common.types'

// مطابق دقیق با app/schemas/lab_result.py

export interface LabResultResponse {
  id: string
  test_code: string
  test_name_fa: string
  value: number
  unit: string
  ref_range_low?: number | null
  ref_range_high?: number | null
  is_abnormal: boolean
  is_critical: boolean
  abnormality_direction?: 'high' | 'low' | null
  status_fa: string
  note?: string | null
}

export interface LabPanelResponse {
  id: string
  patient_id: string
  collected_at: string
  reported_at?: string | null
  notes?: string | null
  results: LabResultResponse[]
  abnormal_count: number
  critical_count: number
}

export interface LabTrendPoint {
  date: string
  value: number
  is_abnormal: boolean
  is_critical: boolean
}

export interface LabTrendResponse {
  test_code: string
  test_name_fa: string
  unit: string
  points: LabTrendPoint[]
  trend_direction?: string | null
  latest_value?: number | null
  normal_low?: number | null
  normal_high?: number | null
}

export interface CreateLabResultItem {
  test_code: string
  value: number
  unit: string
  note?: string
}

export interface CreateLabPanelRequest {
  collected_at: string
  reported_at?: string
  notes?: string
  results: CreateLabResultItem[]
}

export interface LabReferenceRange {
  test_code: string
  unit: string
  normal_low: number
  normal_high: number
  critical_low?: number
  critical_high?: number
  valid_min: number
  valid_max: number
  description_fa: string
}

// لیست کدهای آزمایش با برچسب فارسی — مطابق با LabTestCode enum بک‌اند
export const LAB_TEST_LABELS: Record<string, string> = {
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

export const LAB_TEST_UNITS: Record<string, string> = {
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

// کدهای آزمایش که باید در فرم نمایش داده شوند
export const LAB_TEST_CODES = Object.keys(LAB_TEST_LABELS)