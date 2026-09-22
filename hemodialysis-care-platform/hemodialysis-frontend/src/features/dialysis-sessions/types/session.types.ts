import type { SessionEvent, HealthStatus, TrendDirection } from '@/types/common.types'

export interface SessionFormData {
  session_date: string
  session_start_time?: string
  session_end_time?: string
  duration_minutes?: number
  pre_weight: number
  post_weight?: number
  bp_pre_systolic?: number
  bp_pre_diastolic?: number
  bp_during_systolic?: number
  bp_during_diastolic?: number
  bp_post_systolic?: number
  bp_post_diastolic?: number
  intradialytic_events?: SessionEvent[]
  notes?: string
}

export interface DialysisSession {
  id: string
  patient_id: string
  session_date: string
  session_start_time?: string
  session_end_time?: string
  duration_minutes?: number
  pre_weight: number
  post_weight?: number
  dry_weight_at_session: number
  weight_gain?: number
  uf_volume?: number
  idwg_percent?: number
  bp_pre_systolic?: number
  bp_pre_diastolic?: number
  bp_during_systolic?: number
  bp_during_diastolic?: number
  bp_post_systolic?: number
  bp_post_diastolic?: number
  intradialytic_events?: SessionEvent[]
  notes?: string
  recorded_by: string
  created_at: string
  updated_at: string
}

export interface WeightTrendPoint {
  date: string
  pre_weight: number
  post_weight?: number
  dry_weight: number
  weight_gain?: number
  idwg_percent?: number
  status: HealthStatus
}

export interface WeightTrendData {
  sessions: WeightTrendPoint[]
  average_idwg_percent: number
  trend: TrendDirection
  concerning: boolean
}

export interface BPTrendPoint {
  date: string
  pre: { systolic?: number; diastolic?: number }
  during: { systolic?: number; diastolic?: number }
  post: { systolic?: number; diastolic?: number }
  status: HealthStatus
}

export interface BPTrendData {
  sessions: BPTrendPoint[]
  trend: TrendDirection
  average_pre_systolic: number
}