import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { ApiResponse, PaginatedApiResponse } from '@/types/api.types'
import type {
  LabPanelResponse,
  LabTrendResponse,
  LabReferenceRange,
  CreateLabPanelRequest,
} from '../types/lab.types'

export const labsService = {
  // GET /patients/{id}/labs — تاریخچه پنل‌ها
  getPanels: async (
    patientId: string,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedApiResponse<LabPanelResponse>> => {
    const res = await apiClient.get(
      API_ENDPOINTS.labs.list(patientId),
      { params }
    )
    return res.data
  },

  // GET /patients/{id}/labs/latest — آخرین مقادیر
  getLatest: async (patientId: string): Promise<LabPanelResponse | null> => {
    try {
      const res = await apiClient.get<ApiResponse<LabPanelResponse>>(
        API_ENDPOINTS.labs.latest(patientId)
      )
      return res.data.data
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) return null
      throw err
    }
  },

  // GET /patients/{id}/labs/{panel_id}
  getPanel: async (
    patientId: string,
    panelId: string
  ): Promise<LabPanelResponse> => {
    const res = await apiClient.get<ApiResponse<LabPanelResponse>>(
      API_ENDPOINTS.labs.panelDetail(patientId, panelId)
    )
    return res.data.data
  },

  // POST /patients/{id}/labs
  createPanel: async (
    patientId: string,
    data: CreateLabPanelRequest
  ): Promise<LabPanelResponse> => {
    const res = await apiClient.post<ApiResponse<LabPanelResponse>>(
      API_ENDPOINTS.labs.create(patientId),
      data
    )
    return res.data.data
  },

  // GET /patients/{id}/labs/trend/{test_code}
  getTrend: async (
    patientId: string,
    testCode: string
  ): Promise<LabTrendResponse> => {
    const res = await apiClient.get<ApiResponse<LabTrendResponse>>(
      API_ENDPOINTS.labs.trend(patientId, testCode)
    )
    return res.data.data
  },

  // GET /labs/reference-ranges
  getReferenceRanges: async (): Promise<LabReferenceRange[]> => {
    const res = await apiClient.get<ApiResponse<LabReferenceRange[]>>(
      API_ENDPOINTS.labs.referenceRanges
    )
    return res.data.data ?? []
  },
}