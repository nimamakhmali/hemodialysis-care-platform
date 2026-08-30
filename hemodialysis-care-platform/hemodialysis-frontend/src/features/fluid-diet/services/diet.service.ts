// src/features/fluid-diet/services/diet.service.ts
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  DietLog,
  DietLogCreateRequest,
  DietSummary,
} from "../types/fluid-diet.types";

export const dietService = {
  log: async (
    patientId: string,
    data: DietLogCreateRequest
  ): Promise<DietLog> => {
    const res = await apiClient.post(
      API_ENDPOINTS.diet.log(patientId),
      data
    );
    return res.data?.data ?? res.data;
  },

  getHistory: async (
    patientId: string,
    params?: { days?: number; page?: number; size?: number }
  ): Promise<DietLog[]> => {
    const res = await apiClient.get(
      API_ENDPOINTS.diet.history(patientId),
      { params }
    );
    return res.data?.data ?? res.data ?? [];
  },

  getSummary: async (patientId: string): Promise<DietSummary> => {
    const res = await apiClient.get(
      API_ENDPOINTS.diet.summary(patientId)
    );
    return res.data?.data ?? res.data;
  },
};