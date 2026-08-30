// src/features/alerts/services/alerts.service.ts
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AlertFilters,
  AlertsResponse,
  AcknowledgeAlertRequest,
  ResolveAlertRequest,
} from "../types/alert.types";

export const alertsService = {
  getAll: async (filters?: AlertFilters): Promise<AlertsResponse> => {
    const res = await apiClient.get(API_ENDPOINTS.alerts.all, {
      params: filters,
    });
    return res.data;
  },

  getPatientAlerts: async (
    patientId: string,
    filters?: Omit<AlertFilters, "patient_id">
  ): Promise<AlertsResponse> => {
    const res = await apiClient.get(
      API_ENDPOINTS.alerts.patient(patientId),
      { params: filters }
    );
    return res.data;
  },

  acknowledge: async (
    alertId: string,
    data?: AcknowledgeAlertRequest
  ) => {
    const res = await apiClient.put(
      API_ENDPOINTS.alerts.acknowledge(alertId),
      data ?? {}
    );
    return res.data;
  },

  resolve: async (alertId: string, data?: ResolveAlertRequest) => {
    const res = await apiClient.put(
      API_ENDPOINTS.alerts.resolve(alertId),
      data ?? {}
    );
    return res.data;
  },
};