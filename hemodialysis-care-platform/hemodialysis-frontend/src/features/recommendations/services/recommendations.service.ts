import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type {
  Recommendation,
  ApproveRecommendationRequest,
  RejectRecommendationRequest,
  PendingCountResponse,
} from '../types/recommendation.types'
import type { PaginatedApiResponse, ApiResponse } from '@/types/api.types'

export const recommendationsService = {
  getPending: async (): Promise<Recommendation[]> => {
    const res = await apiClient.get<ApiResponse<Recommendation[]>>(
      API_ENDPOINTS.recommendations.pending
    )
    return res.data?.data ?? []
  },

  getPendingCount: async (): Promise<number> => {
    const res = await apiClient.get<ApiResponse<PendingCountResponse>>(
      API_ENDPOINTS.recommendations.pendingCount
    )
    // پوشش هر دو شکل احتمالی پاسخ بک‌اند
    const d = res.data?.data
    return d?.pending_count ?? d?.count ?? 0
  },

  getPatientRecommendations: async (
    patientId: string
  ): Promise<Recommendation[]> => {
    const res = await apiClient.get<ApiResponse<Recommendation[]>>(
      API_ENDPOINTS.recommendations.patient(patientId)
    )
    return res.data?.data ?? []
  },

  approve: async (
    id: string,
    data: ApproveRecommendationRequest
  ): Promise<Recommendation> => {
    const res = await apiClient.post<ApiResponse<Recommendation>>(
      API_ENDPOINTS.recommendations.approve(id),
      data
    )
    return res.data.data
  },

  reject: async (
    id: string,
    data: RejectRecommendationRequest
  ): Promise<Recommendation> => {
    const res = await apiClient.post<ApiResponse<Recommendation>>(
      API_ENDPOINTS.recommendations.reject(id),
      data
    )
    return res.data.data
  },
}