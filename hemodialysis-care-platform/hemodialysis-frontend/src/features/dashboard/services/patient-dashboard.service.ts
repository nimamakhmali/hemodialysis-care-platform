// src/features/dashboard/services/patient-dashboard.service.ts
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export interface PatientDashboardData {
  patient_info: {
    id: string;
    full_name: string;
    dry_weight: number;
    dialysis_frequency: number;
    vascular_access_type: string;
  };
  weight_summary: {
    last_pre_weight?: number | null;
    last_post_weight?: number | null;
    dry_weight: number;
    weight_gain?: number | null;
    idwg_percent?: number | null;
    status: "ok" | "warning" | "critical";
    trend: "stable" | "increasing" | "decreasing";
    last_session_date?: string | null;
  };
  bp_summary: {
    last_pre_systolic?: number | null;
    last_pre_diastolic?: number | null;
    last_post_systolic?: number | null;
    last_post_diastolic?: number | null;
    trend: "stable" | "increasing" | "decreasing";
    status: "ok" | "warning" | "critical";
  };
  lab_summary: Record<
    string,
    {
      value: number;
      unit: string;
      date: string;
      status: "normal" | "abnormal_low" | "abnormal_high" | "critical_low" | "critical_high";
    }
  >;
  risk?: {
    score: number;
    level: "low" | "medium" | "high";
    interpretation_fa: string;
  } | null;
  recent_messages: Array<{
    id: string;
    title: string;
    sent_at: string;
    read_at?: string | null;
  }>;
  unread_count: number;
  relevant_education: Array<{
    topic_code: string;
    title_fa: string;
    tags: string[];
  }>;
  today_tasks: Array<{
    id: string;
    label: string;
    done: boolean;
    href: string;
  }>;
}

export const patientDashboardService = {
  getDashboard: async (patientId: string): Promise<PatientDashboardData> => {
    const res = await apiClient.get(
      API_ENDPOINTS.patients.dashboard(patientId)
    );
    return res.data?.data ?? res.data;
  },
};