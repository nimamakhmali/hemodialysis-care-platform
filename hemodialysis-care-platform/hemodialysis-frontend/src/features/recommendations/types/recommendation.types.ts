import type { AlertSeverity, RecommendationStatus } from '@/types/common.types'

export interface Recommendation {
  id: string
  patient_id: string
  patient_name?: string
  alert_id?: string
  draft_for_clinician: string
  patient_content?: string
  education_topic?: string
  status: RecommendationStatus
  priority: AlertSeverity
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  created_at: string
  updated_at: string
}

export interface ApproveRecommendationRequest {
  patient_content?: string
}

export interface RejectRecommendationRequest {
  reason: string
}

export interface PendingCountResponse {
  pending_count?: number
  count?: number
}