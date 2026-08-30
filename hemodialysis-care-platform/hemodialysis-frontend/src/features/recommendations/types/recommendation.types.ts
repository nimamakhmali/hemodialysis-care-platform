// src/features/recommendations/types/recommendation.types.ts
import type { AlertSeverity, RecommendationStatus } from "@/types/common.types";

export interface Recommendation {
  id: string;
  patient_id: string;
  patient_name?: string | null;
  alert_id?: string | null;
  draft_for_clinician: string;
  patient_content?: string | null;
  education_topic?: string | null;
  status: RecommendationStatus;
  priority: AlertSeverity;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  triggered_by_rule?: string | null;
  evidence?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ApproveRecommendationRequest {
  patient_content?: string;
}

export interface RejectRecommendationRequest {
  reason: string;
}

export interface RecommendationFilters {
  status?: RecommendationStatus;
  patient_id?: string;
  page?: number;
  size?: number;
}