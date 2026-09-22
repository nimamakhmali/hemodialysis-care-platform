import type { HealthStatus, AlertSeverity } from '@/types/common.types'

// مطابق دقیق با بک‌اند

export interface PatientSummary {
  id: string
  user_id: string | null
  medical_record_number: string
  full_name: string
  date_of_birth: string
  age?: number | null
  gender: 'male' | 'female'
  phone_number: string
  dry_weight: number | null
  vascular_access_type: 'fistula' | 'graft' | 'catheter' | null
  dialysis_frequency: number | null
  dialysis_start_date: string | null
  is_active: boolean
  assigned_clinician_id: string | null
  created_at: string
  updated_at: string
  // Summary fields from /patients/{id}/summary/
  summary?: {
    last_session: {
      id: string
      session_date: string
      pre_weight: number
      post_weight: number | null
      idwg_percent: number | null
    } | null
    active_alerts: {
      high: number
      medium: number
      low: number
    }
    risk?: {
      score: number
      level: AlertSeverity
      interpretation_fa: string
    } | null
    unread_messages_count: number
    weight_status: HealthStatus
    bp_status: HealthStatus
  } | null
}

export interface PatientDetail extends PatientSummary {
  comorbidities?: Record<string, boolean | string> | null
  dry_weight_updated_at: string | null
  clinical_notes?: string | null
}

export interface CreatePatientRequest {
  medical_record_number: string
  full_name: string
  date_of_birth: string
  gender: 'male' | 'female'
  phone_number: string
  dry_weight?: number
  vascular_access_type?: 'fistula' | 'graft' | 'catheter'
  dialysis_frequency?: number
  dialysis_start_date?: string
  comorbidities?: Record<string, boolean>
  assigned_clinician_id?: string
  create_user_account?: boolean
  password?: string
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {}

export interface PatientFilters {
  page?: number
  size?: number
  search?: string
  is_active?: boolean
  vascular_access_type?: string
}