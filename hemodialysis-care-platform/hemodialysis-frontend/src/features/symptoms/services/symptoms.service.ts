// src/features/symptoms/services/symptoms.service.ts
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  SymptomReport,
  SymptomReportCreateRequest,
  SymptomSummary,
  SymptomFilters,
} from "../types/symptom.types";

export const symptomsService = {
  create: async (
    patientId: string,
    data: SymptomReportCreateRequest
  ): Promise<SymptomReport> => {
    const res = await apiClient.post(
      API_ENDPOINTS.symptoms.create(patientId),
      data
    );
    return res.data?.data ?? res.data;
  },

  getHistory: async (
    patientId: string,
    filters?: SymptomFilters
  ): Promise<SymptomReport[]> => {
    const res = await apiClient.get(
      API_ENDPOINTS.symptoms.list(patientId),
      { params: filters }
    );
    return res.data?.data ?? res.data ?? [];
  },

  getSummary: async (patientId: string): Promise<SymptomSummary> => {
    const res = await apiClient.get(
      API_ENDPOINTS.symptoms.summary(patientId)
    );
    return res.data?.data ?? res.data;
  },
};