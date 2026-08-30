import type { AlertSeverity, AlertStatus, AlertCategory } from "@/types/common.types";

export interface Alert {
  id: string;
  patient_id: string;
  patient_name?: string | null;
  severity: AlertSeverity;
  severity_fa?: string;
  category: AlertCategory;
  category_fa?: string;
  title: string;
  clinician_explanation: string;
  evidence: Record<string, unknown>;
  triggered_by_rule: string;
  status: AlertStatus;
  status_fa?: string;
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface AlertStats {
  total_new: number;
  total_high: number;
  total_medium: number;
  total_low: number;
}

export interface AlertsResponse {
  success: boolean;
  data: Alert[];
  stats: AlertStats;
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface AlertFilters {
  severity?: AlertSeverity;
  status?: AlertStatus;
  patient_id?: string;
  page?: number;
  size?: number;
}

export interface AcknowledgeAlertRequest {
  note?: string;
}

export interface ResolveAlertRequest {
  resolution_note?: string;
}