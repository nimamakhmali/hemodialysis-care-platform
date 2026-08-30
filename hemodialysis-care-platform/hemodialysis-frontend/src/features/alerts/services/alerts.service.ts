import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { AlertsResponse, AlertFilters, Alert } from "../types/alert.types";
import type { ApiResponse } from "@/types/api.types";
import type { AlertSeverity, AlertStatus } from "@/types/common.types";

export const alertsService = {
  async getAll(filters: AlertFilters = {}): Promise<AlertsResponse> {
    const params = new URLSearchParams();
    if (filters.severity) params.set("severity", filters.severity);
    if (filters.status) params.set("status", filters.status);
    params.set("page", String(filters.page ?? 1));
    params.set("size", String(filters.size ?? 50));

    const res = await apiClient.get<AlertsResponse>(
      `${API_ENDPOINTS.alerts.all}?${params.toString()}`
    );
    return res.data;
  },

  async getPatientAlerts(
    patientId: string,
    filters: Omit<AlertFilters, "patient_id"> = {}
  ): Promise<AlertsResponse> {
    const params = new URLSearchParams();
    if (filters.severity) params.set("severity", filters.severity);
    if (filters.status) params.set("status", filters.status);
    params.set("page", String(filters.page ?? 1));
    params.set("size", String(filters.size ?? 20));

    const res = await apiClient.get<AlertsResponse>(
      `${API_ENDPOINTS.alerts.patient(patientId)}?${params.toString()}`
    );
    return res.data;
  },

  async acknowledge(alertId: string, note?: string): Promise<Alert> {
    const res = await apiClient.put<ApiResponse<Alert>>(
      API_ENDPOINTS.alerts.acknowledge(alertId),
      { note }
    );
    return res.data.data;
  },

  async resolve(alertId: string, resolutionNote?: string): Promise<Alert> {
    const res = await apiClient.put<ApiResponse<Alert>>(
      API_ENDPOINTS.alerts.resolve(alertId),
      { resolution_note: resolutionNote }
    );
    return res.data.data;
  },
};