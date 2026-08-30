// src/features/dialysis-sessions/types/session.types.ts

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
  weight_gain_percent?: number
  uf_volume?: number

  bp_pre_systolic?: number
  bp_pre_diastolic?: number
  bp_during_systolic?: number
  bp_during_diastolic?: number
  bp_post_systolic?: number
  bp_post_diastolic?: number

  had_intradialytic_hypotension?: boolean
  intradialytic_events?: string[]
  notes?: string
  recorded_by?: string
  created_at: string
}

export interface WeightTrendPoint {
  date: string
  pre_weight: number
  post_weight?: number
  dry_weight: number
  weight_gain_kg?: number
  weight_gain_percent?: number
}

export interface BPTrendPoint {
  date: string
  pre_systolic?: number
  pre_diastolic?: number
  during_systolic?: number
  during_diastolic?: number
  post_systolic?: number
  post_diastolic?: number
  had_idh?: boolean
}

export interface SessionFormData {
  session_date: string
  session_start_time?: string
  session_end_time?: string
  pre_weight: number
  post_weight?: number
  bp_pre_systolic?: number
  bp_pre_diastolic?: number
  bp_during_systolic?: number
  bp_during_diastolic?: number
  bp_post_systolic?: number
  bp_post_diastolic?: number
  intradialytic_events?: string[]
  notes?: string
}

export type WeightStatus = 'ok' | 'warning' | 'critical' | 'unknown'
export type BPStatus = 'ok' | 'warning' | 'critical' | 'unknown'

export interface IDWGResult {
  kg: number
  percent: number
  status: WeightStatus
  label: string
  color: string
}