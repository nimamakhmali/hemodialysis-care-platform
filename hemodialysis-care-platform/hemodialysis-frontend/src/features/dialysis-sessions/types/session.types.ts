import type { HealthStatus, SessionEvent, TrendDirection } from "@/types/common.types";

export interface DialysisSession {
  id: string;
  patient_id: string;
  session_date: string;
  session_start_time?: string | null;
  duration_minutes?: number | null;
  pre_weight: number;
  post_weight?: number | null;
  dry_weight_at_session: number;
  weight_gain?: number | null;
  weight_gain_percent?: number | null;
  uf_volume?: number | null;
  bp_pre_systolic?: number | null;
  bp_pre_diastolic?: number | null;
  bp_during_systolic?: number | null;
  bp_during_diastolic?: number | null;
  bp_post_systolic?: number | null;
  bp_post_diastolic?: number | null;
  bp_drop_during?: number | null;
  intradialytic_events?: SessionEvent[] | null;
  notes?: string | null;
  had_intradialytic_hypotension: boolean;
  created_at: string;
}

export interface SessionsResponse {
  success: boolean;
  data: DialysisSession[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface WeightTrendPoint {
  date: string;
  pre_weight: number;
  post_weight?: number | null;
  dry_weight: number;
  weight_gain?: number | null;
  idwg_percent?: number | null;
  status: HealthStatus;
}

export interface WeightTrend {
  sessions: WeightTrendPoint[];
  average_idwg_percent: number;
  trend: TrendDirection;
  concerning: boolean;
}

export interface BPTrendPoint {
  date: string;
  pre: { systolic?: number; diastolic?: number };
  during: { systolic?: number; diastolic?: number };
  post: { systolic?: number; diastolic?: number };
  status: HealthStatus;
}

export interface BPTrend {
  sessions: BPTrendPoint[];
  trend: TrendDirection;
  average_pre_systolic: number;
}

export interface CreateSessionForm {
  session_date: string;
  session_start_time?: string;
  session_end_time?: string;
  duration_minutes?: number;
  pre_weight: number;
  post_weight?: number;
  bp_pre_systolic?: number;
  bp_pre_diastolic?: number;
  bp_during_systolic?: number;
  bp_during_diastolic?: number;
  bp_post_systolic?: number;
  bp_post_diastolic?: number;
  intradialytic_events?: SessionEvent[];
  notes?: string;
}

export interface SessionFilters {
  from_date?: string;
  to_date?: string;
  page?: number;
  size?: number;
}