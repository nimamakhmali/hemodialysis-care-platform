// src/features/recommendations/services/recommendations.service.ts
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  Recommendation,
  ApproveRecommendationRequest,
  RejectRecommendationRequest,
} from "../types/recommendation.types";

export const recommendationsService = {
  getPending: async (): Promise<Recommendation[]> => {
    const res = await apiClient.get(API_ENDPOINTS.recommendations.pending);
    return res.data?.data ?? res.data;
  },

  getPendingCount: async (): Promise<number> => {
    const res = await apiClient.get("/recommendations/pending-count/");
    return res.data?.data?.count ?? 0;
  },

  getPatientRecommendations: async (
    patientId: string
  ): Promise<Recommendation[]> => {
    const res = await apiClient.get(
      API_ENDPOINTS.recommendations.patient(patientId)
    );
    return res.data?.data ?? res.data;
  },

  approve: async (
    id: string,
    data: ApproveRecommendationRequest
  ): Promise<Recommendation> => {
    const res = await apiClient.post(
      API_ENDPOINTS.recommendations.approve(id),
      data
    );
    return res.data?.data ?? res.data;
  },

  reject: async (
    id: string,
    data: RejectRecommendationRequest
  ): Promise<Recommendation> => {
    const res = await apiClient.post(
      API_ENDPOINTS.recommendations.reject(id),
      data
    );
    return res.data?.data ?? res.data;
  },
};