// src/features/dashboard/services/clinician-dashboard.service.ts
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ClinicianDashboard } from "../types/clinician-dashboard.types";

export const clinicianDashboardService = {
  getDashboard: async (): Promise<ClinicianDashboard> => {
    const res = await apiClient.get(API_ENDPOINTS.clinician.dashboard);
    return res.data?.data ?? res.data;
  },

  getPatientsOverview: async (params?: {
    page?: number;
    size?: number;
    sort_by?: string;
  }) => {
    const res = await apiClient.get(API_ENDPOINTS.clinician.overview, {
      params,
    });
    return res.data?.data ?? res.data;
  },

  getAlertsFeed: async (params?: {
    severity?: string;
    page?: number;
    size?: number;
  }) => {
    const res = await apiClient.get(API_ENDPOINTS.clinician.alertsFeed, {
      params,
    });
    return res.data?.data ?? res.data;
  },
};