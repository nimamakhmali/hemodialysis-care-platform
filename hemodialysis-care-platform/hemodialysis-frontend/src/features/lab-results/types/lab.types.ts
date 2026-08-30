import type { HealthStatus, LabTestCode, TrendDirection } from "@/types/common.types";

export interface LabResult {
  id: string;
  test_code: LabTestCode;
  test_name_fa: string;
  value: number;
  unit: string;
  ref_range_low?: number | null;
  ref_range_high?: number | null;
  is_abnormal: boolean;
  is_critical: boolean;
  abnormality_direction?: "high" | "low" | null;
  status_fa?: string;
  note?: string | null;
}

export interface LabPanel {
  id: string;
  patient_id: string;
  collected_at: string;
  reported_at?: string | null;
  notes?: string | null;
  results: LabResult[];
  abnormal_count: number;
  critical_count: number;
  created_at: string;
}

export interface LabPanelsResponse {
  success: boolean;
  data: LabPanel[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface LabTrendPoint {
  date: string;
  value: number;
  is_abnormal: boolean;
  status: HealthStatus;
}

export interface LabTrendResponse {
  test_code: LabTestCode;
  unit: string;
  history: LabTrendPoint[];
  trend: {
    direction: TrendDirection;
    slope: number;
    isConcerning: boolean;
    interpretationFa: string;
    changePercent: number;
  };
}

export interface ReferenceRange {
  test_code: string;
  name_fa: string;
  unit: string;
  normal_low: number;
  normal_high: number;
  critical_low?: number | null;
  critical_high?: number | null;
  description?: string;
}

export interface CreateLabPanelForm {
  collected_at: string;
  reported_at?: string;
  notes?: string;
  results: Array<{
    test_code: LabTestCode;
    value: number;
    unit: string;
  }>;
}