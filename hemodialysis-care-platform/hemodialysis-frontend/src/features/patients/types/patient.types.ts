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
      weight_gain?: number | null
      idwg_percent: number | null
      bp_pre_systolic?: number | null
      bp_pre_diastolic?: number | null
    } | null
    active_alerts: {
      high: number
      medium: number
      low: number
      total?: number
    }
    risk?: {
      score: number
      level: AlertSeverity
      interpretation_fa: string
    } | null
    unread_messages_count: number
    weight_status: HealthStatus
    bp_status: HealthStatus
    latest_labs?: Record<
      string,
      { value: number; unit?: string; status?: HealthStatus | string } | null
    > | null
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

export type PatientStatus = 'all' | 'active' | 'inactive'
export type PatientSortBy = 'name' | 'last_session' | 'risk_score' | 'alert_count'
export type PatientSortOrder = 'asc' | 'desc'

export interface PatientFilters {
  page?: number
  size?: number
  search?: string
  is_active?: boolean
  vascular_access_type?: string
  status?: PatientStatus
  has_active_alerts?: boolean
  no_recent_data?: boolean
  sort_by?: PatientSortBy
  sort_order?: PatientSortOrder
}

export type TimelineEventType =
  | 'session'
  | 'lab'
  | 'symptom'
  | 'fluid'
  | 'diet'
  | 'alert'
  | 'message'
  | 'recommendation'

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  title: string
  description?: string | null
  timestamp: string
  severity?: AlertSeverity | null
  metadata?: Record<string, unknown> | null
}