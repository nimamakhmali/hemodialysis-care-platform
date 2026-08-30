// src/features/patients/hooks/usePatientClinicalSummary.ts
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export interface ClinicalSummary {
  patient_id: string;
  full_name: string;
  dry_weight: number;
  last_session_date?: string | null;
  last_pre_weight?: number | null;
  last_idwg_percent?: number | null;
  last_bp_pre_systolic?: number | null;
  last_bp_pre_diastolic?: number | null;
  active_alerts_high: number;
  active_alerts_medium: number;
  risk_score?: number | null;
  risk_level?: "low" | "medium" | "high" | null;
  recent_labs?: Record<string, { value: number; date: string; status: string }>;
}

export function usePatientClinicalSummary(patientId: string) {
  return useQuery({
    queryKey: ["clinicalSummary", patientId],
    queryFn: async (): Promise<ClinicalSummary> => {
      const res = await apiClient.get(
        API_ENDPOINTS.clinician.clinicalSummary(patientId)
      );
      return res.data?.data ?? res.data;
    },
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,
  });
}