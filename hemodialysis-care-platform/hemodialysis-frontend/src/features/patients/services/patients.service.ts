import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { ApiResponse, PaginatedApiResponse } from '@/types/api.types'
import type {
  PatientSummary,
  PatientDetail,
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientFilters,
} from '../types/patient.types'

export const patientsService = {
  getList: async (
    filters?: PatientFilters
  ): Promise<PaginatedApiResponse<PatientSummary>> => {
    const res = await apiClient.get(API_ENDPOINTS.patients.list, {
      params: filters,
    })
    return res.data
  },

  getDetail: async (id: string): Promise<PatientDetail> => {
    const res = await apiClient.get<ApiResponse<PatientDetail>>(
      API_ENDPOINTS.patients.detail(id)
    )
    return res.data.data
  },

  getSummary: async (id: string): Promise<PatientSummary> => {
    const res = await apiClient.get<ApiResponse<PatientSummary>>(
      API_ENDPOINTS.patients.summary(id)
    )
    return res.data.data
  },

  create: async (data: CreatePatientRequest): Promise<PatientDetail> => {
    const res = await apiClient.post<ApiResponse<PatientDetail>>(
      API_ENDPOINTS.patients.create,
      data
    )
    return res.data.data
  },

  update: async (
    id: string,
    data: UpdatePatientRequest
  ): Promise<PatientDetail> => {
    const res = await apiClient.put<ApiResponse<PatientDetail>>(
      API_ENDPOINTS.patients.update(id),
      data
    )
    return res.data.data
  },

  deactivate: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.patients.deactivate(id))
  },

  search: async (query: string): Promise<PatientSummary[]> => {
    const res = await apiClient.get<ApiResponse<PatientSummary[]>>(
      API_ENDPOINTS.patients.search,
      { params: { q: query } }
    )
    return res.data.data ?? []
  },
}