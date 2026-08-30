import type { AlertSeverity, VascularAccessType, Gender, LabTestCode } from "@/types/common.types";

export type DialysisFrequency = 1 | 2 | 3 | 4;

export type LabStatus =
  | "normal"
  | "abnormal_low"
  | "abnormal_high"
  | "critical_low"
  | "critical_high";

export interface Patient {
  id: string;
  medical_record_number: string;
  full_name: string;
  date_of_birth: string;
  gender: Gender;
  phone_number: string;
  dry_weight: number;
  dry_weight_updated_at: string;
  vascular_access_type: VascularAccessType;
  dialysis_frequency: DialysisFrequency;
  dialysis_start_date: string;
  comorbidities?: string[] | null;
  user_id?: string | null;
  assigned_clinician_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LabSnapshot {
  value: number;
  date: string;
  status: LabStatus;
  unit?: string;
}

export interface AlertCountSnapshot {
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface RiskFactor {
  factor: string;
  contribution: number;
  detail: string;
}

export interface RiskSnapshot {
  score: number;
  level: "low" | "medium" | "high";
  interpretation_fa: string;
  contributing_factors?: RiskFactor[];
}

export interface SessionSnapshot {
  id: string;
  session_date: string;
  pre_weight: number;
  post_weight?: number | null;
  weight_gain?: number | null;
  idwg_percent?: number | null;
  bp_pre_systolic?: number | null;
  bp_pre_diastolic?: number | null;
  bp_during_systolic?: number | null;
  bp_post_systolic?: number | null;
}

export interface PatientSummary {
  id: string;
  medical_record_number: string;
  full_name: string;
  gender: Gender;
  date_of_birth: string;
  dry_weight: number;
  dialysis_frequency: DialysisFrequency;
  vascular_access_type: VascularAccessType;
  dialysis_start_date: string;
  is_active: boolean;
  last_session_date?: string | null;
  last_pre_weight?: number | null;
  last_idwg_percent?: number | null;
  last_bp_pre_systolic?: number | null;
  last_bp_pre_diastolic?: number | null;
  last_k_value?: number | null;
  last_hb_value?: number | null;
  last_k_status?: LabStatus | null;
  last_hb_status?: LabStatus | null;
  active_alerts_high: number;
  active_alerts_medium: number;
  active_alerts_low: number;
  risk_score?: number | null;
  risk_level?: "low" | "medium" | "high" | null;
}

export interface PatientDetail extends Patient {
  summary: {
    last_session?: SessionSnapshot | null;
    latest_labs?: Partial<Record<LabTestCode, LabSnapshot>>;
    active_alerts: AlertCountSnapshot;
    risk?: RiskSnapshot | null;
  };
}

export interface CreatePatientForm {
  medical_record_number: string;
  full_name: string;
  date_of_birth: string;
  gender: Gender;
  phone_number: string;
  dry_weight: number;
  vascular_access_type: VascularAccessType;
  dialysis_frequency: DialysisFrequency;
  dialysis_start_date: string;
  comorbidities?: string[];
}

export type UpdatePatientForm = Partial<CreatePatientForm>;

export interface PatientFilters {
  search?: string;
  status?: "active" | "inactive" | "all";
  has_active_alerts?: boolean;
  no_recent_data?: boolean;
  sort_by?: "name" | "last_session" | "risk_score" | "alert_count";
  sort_order?: "asc" | "desc";
}

export type TimelineEventType =
  | "session"
  | "lab"
  | "symptom"
  | "fluid"
  | "diet"
  | "alert"
  | "message"
  | "recommendation";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  title: string;
  description?: string;
  severity?: AlertSeverity;
  metadata?: Record<string, unknown>;
}