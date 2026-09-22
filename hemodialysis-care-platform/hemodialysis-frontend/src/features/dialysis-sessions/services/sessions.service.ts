import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { ApiResponse, PaginatedApiResponse } from '@/types/api.types'
import type {
  SessionResponse,
  SessionFormData,
  WeightTrendItem,
  BPTrendItem,
} from '../types/session.types'

export const sessionsService = {
  getList: async (
    patientId: string,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedApiResponse<SessionResponse>> => {
    const res = await apiClient.get(
      API_ENDPOINTS.sessions.list(patientId),
      { params }
    )
    return res.data
  },

  create: async (
    patientId: string,
    data: SessionFormData
  ): Promise<SessionResponse> => {
    const res = await apiClient.post<ApiResponse<SessionResponse>>(
      API_ENDPOINTS.sessions.create(patientId),
      data
    )
    return res.data.data
  },

  getDetail: async (
    patientId: string,
    sessionId: string
  ): Promise<SessionResponse> => {
    const res = await apiClient.get<ApiResponse<SessionResponse>>(
      API_ENDPOINTS.sessions.detail(patientId, sessionId)
    )
    return res.data.data
  },

  getWeightTrend: async (patientId: string): Promise<WeightTrendItem[]> => {
    const res = await apiClient.get<ApiResponse<WeightTrendItem[]>>(
      API_ENDPOINTS.sessions.weightTrend(patientId)
    )
    return res.data.data ?? []
  },

  getBPTrend: async (patientId: string): Promise<BPTrendItem[]> => {
    const res = await apiClient.get<ApiResponse<BPTrendItem[]>>(
      API_ENDPOINTS.sessions.bpTrend(patientId)
    )
    return res.data.data ?? []
  },
}