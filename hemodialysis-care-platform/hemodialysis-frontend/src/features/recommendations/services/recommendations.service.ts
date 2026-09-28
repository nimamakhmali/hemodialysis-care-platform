import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type {
  ApiResponse,
  PaginatedApiResponse,
  RecommendationItem,
} from '@/types/api.types'

export interface ApprovePayload {
  patient_content?: string
}

export interface RejectPayload {
  reason: string
}

export const recommendationsService = {
  getPending: async (): Promise<PaginatedApiResponse<RecommendationItem>> => {
    const res = await apiClient.get(API_ENDPOINTS.recommendations.pending)
    return res.data
  },

  getPatientRecommendations: async (
    patientId: string,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedApiResponse<RecommendationItem>> => {
    const res = await apiClient.get(
      API_ENDPOINTS.recommendations.patient(patientId),
      { params }
    )
    return res.data
  },

  approve: async (
    recId: string,
    payload?: ApprovePayload
  ): Promise<RecommendationItem> => {
    const res = await apiClient.post<ApiResponse<RecommendationItem>>(
      API_ENDPOINTS.recommendations.approve(recId),
      payload ?? {}
    )
    return res.data.data
  },

  reject: async (
    recId: string,
    payload: RejectPayload
  ): Promise<RecommendationItem> => {
    const res = await apiClient.post<ApiResponse<RecommendationItem>>(
      API_ENDPOINTS.recommendations.reject(recId),
      payload
    )
    return res.data.data
  },
}