import type { SessionEvent } from '@/types/common.types'

export interface SessionFormData {
  session_date: string
  session_start_time?: string
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

export interface SessionResponse {
  id: string
  patient_id: string
  session_date: string
  session_start_time: string | null
  session_end_time: string | null
  duration_minutes: number | null
  pre_weight: number
  post_weight: number | null
  dry_weight_at_session: number
  weight_gain: number | null
  uf_volume: number | null
  bp_pre_systolic: number | null
  bp_pre_diastolic: number | null
  bp_during_systolic: number | null
  bp_during_diastolic: number | null
  bp_post_systolic: number | null
  bp_post_diastolic: number | null
  intradialytic_events: SessionEvent[]
  notes: string | null
  recorded_by: string
  created_at: string
  updated_at: string
}

export interface WeightTrendItem {
  date: string
  pre_weight: number
  post_weight: number | null
  dry_weight: number
  idwg_kg: number | null
  idwg_percent: number | null
}

export interface BPTrendItem {
  date: string
  pre_systolic: number | null
  pre_diastolic: number | null
  during_systolic: number | null
  during_diastolic: number | null
  post_systolic: number | null
  post_diastolic: number | null
}