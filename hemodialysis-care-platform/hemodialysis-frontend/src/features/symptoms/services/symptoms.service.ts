import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { ApiResponse, PaginatedApiResponse } from '@/types/api.types'
import type {
  SymptomReport,
  SymptomReportCreateRequest,
  SymptomType,
  SymptomSeverity,
} from '../types/symptom.types'

export interface SymptomHistoryPage {
  results: SymptomReport[]
  page: number
  pages: number
  total: number
}

export interface SymptomSummaryResponse {
  frequency: Partial<Record<SymptomType, number>>
  most_common: SymptomType[]
  recent_danger_symptoms: boolean
}

export const symptomsService = {
  getHistory: async (
    patientId: string,
    params?: { page?: number; size?: number }
  ): Promise<SymptomHistoryPage> => {
    const res = await apiClient.get<PaginatedApiResponse<SymptomReport>>(
      API_ENDPOINTS.symptoms.list(patientId),
      { params }
    )
    const data = res.data
    return {
      results: data?.data ?? [],
      page: data?.page ?? params?.page ?? 1,
      pages: data?.pages ?? 1,
      total: data?.total ?? (data?.data ?? []).length,
    }
  },

  getSummary: async (patientId: string): Promise<SymptomSummaryResponse> => {
    const res = await apiClient.get<ApiResponse<SymptomSummaryResponse>>(
      API_ENDPOINTS.symptoms.summary(patientId)
    )
    return res.data.data ?? ({} as SymptomSummaryResponse)
  },

  create: async (
    patientId: string,
    data: SymptomReportCreateRequest
  ): Promise<SymptomReport> => {
    const res = await apiClient.post<ApiResponse<SymptomReport>>(
      API_ENDPOINTS.symptoms.create(patientId),
      data
    )
    return res.data.data
  },
}