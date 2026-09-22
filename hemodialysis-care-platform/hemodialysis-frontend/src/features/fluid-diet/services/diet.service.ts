import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { ApiResponse, PaginatedApiResponse } from '@/types/api.types'
import type { DietLog, UpsertDietLogRequest, DietSummaryResponse } from '../types/fluid-diet.types'

export const dietService = {
  upsert: async (
    patientId: string,
    data: UpsertDietLogRequest
  ): Promise<DietLog> => {
    const res = await apiClient.post<ApiResponse<DietLog>>(
      API_ENDPOINTS.diet.log(patientId),
      data
    )
    return res.data.data
  },

  getHistory: async (
    patientId: string,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedApiResponse<DietLog>> => {
    const res = await apiClient.get(
      API_ENDPOINTS.diet.history(patientId),
      { params }
    )
    return res.data
  },

  getSummary: async (patientId: string): Promise<DietSummaryResponse> => {
    const res = await apiClient.get<ApiResponse<DietSummaryResponse>>(
      API_ENDPOINTS.diet.summary(patientId)
    )
    return res.data.data
  },
}