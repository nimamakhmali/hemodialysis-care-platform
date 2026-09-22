import type {
  AlertSeverity,
  AlertStatus,
  AlertCategory,
} from '@/types/common.types'

export interface Alert {
  id: string
  patient_id: string
  patient_name?: string
  severity: AlertSeverity
  category: AlertCategory
  title: string
  clinician_explanation: string
  evidence: Record<string, unknown>
  triggered_by_rule: string
  status: AlertStatus
  acknowledged_by?: string
  acknowledged_at?: string
  resolved_at?: string
  created_at: string
}

export interface AlertFilters {
  severity?: AlertSeverity
  status?: AlertStatus
  category?: AlertCategory
  patient_id?: string
  page?: number
  size?: number
}

export interface AlertsResponse {
  success: boolean
  data: Alert[]
  total: number
  page: number
  size: number
  pages: number
}

export interface AcknowledgeAlertRequest {
  note?: string
}

export interface ResolveAlertRequest {
  resolution_note?: string
}

export interface AlertStats {
  total_new: number
  total_high: number
  total_medium: number
  total_low: number
}