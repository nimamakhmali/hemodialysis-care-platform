// src/features/dashboard/types/clinician-dashboard.types.ts
import type { AlertSeverity } from "@/types/common.types";

export interface ClinicianDashboardStats {
  total_patients: number;
  active_patients: number;
  active_alerts_high: number;
  active_alerts_medium: number;
  active_alerts_low: number;
  pending_recommendations: number;
  patients_with_no_recent_data: number;
  average_risk_score?: number | null;
}

export interface UrgentPatient {
  patient_id: string;
  full_name: string;
  medical_record_number: string;
  active_alerts_high: number;
  active_alerts_medium: number;
  active_alerts_low: number;
  risk_score?: number | null;
  risk_level?: "low" | "medium" | "high" | null;
  last_session_date?: string | null;
  last_pre_weight?: number | null;
  last_idwg_percent?: number | null;
}

export interface PendingRecommendationSummary {
  id: string;
  patient_id: string;
  patient_name: string;
  draft_for_clinician: string;
  priority: AlertSeverity;
  created_at: string;
  triggered_by_rule?: string | null;
}

export interface RecentActivity {
  id: string;
  type: "session" | "lab" | "symptom" | "fluid" | "diet" | "alert" | "recommendation";
  patient_id: string;
  patient_name: string;
  title: string;
  description?: string;
  timestamp: string;
  severity?: AlertSeverity | null;
}

export interface ClinicianDashboard {
  stats: ClinicianDashboardStats;
  urgent_patients: UrgentPatient[];
  pending_recommendations: PendingRecommendationSummary[];
  recent_activity: RecentActivity[];
}