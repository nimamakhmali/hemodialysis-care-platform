import type { AlertSeverity } from '@/types/common.types'
import type { Alert } from '@/features/alerts/types/alert.types'
import type { Recommendation } from '@/features/recommendations/types/recommendation.types'

export interface ClinicianStats {
  total_patients: number
  active_alerts_high: number
  active_alerts_medium: number
  pending_recommendations: number
  patients_with_no_recent_data: number
}

export interface UrgentPatientRow {
  id: string
  medical_record_number: string
  full_name: string
  active_alerts_high: number
  active_alerts_medium: number
  active_alerts_low: number
  risk_score?: number
  last_session_date?: string
  last_pre_weight?: number
  last_idwg_percent?: number
}

export interface RecentActivity {
  type: 'lab' | 'session' | 'symptom' | 'message'
  patient_id: string
  patient_name: string
  description: string
  time: string
}

export interface ClinicianDashboardData {
  stats: ClinicianStats
  urgent_patients: UrgentPatientRow[]
  pending_recommendations: Recommendation[]
  recent_activity: RecentActivity[]
}