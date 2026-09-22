import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { ApiResponse, PaginatedApiResponse } from '@/types/api.types'
import type { FluidLog, UpsertFluidLogRequest } from '../types/fluid-diet.types'

export const fluidService = {
  upsert: async (
    patientId: string,
    data: UpsertFluidLogRequest
  ): Promise<FluidLog> => {
    const res = await apiClient.post<ApiResponse<FluidLog>>(
      API_ENDPOINTS.fluid.log(patientId),
      data
    )
    return res.data.data
  },

  getHistory: async (
    patientId: string,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedApiResponse<FluidLog>> => {
    const res = await apiClient.get(
      API_ENDPOINTS.fluid.history(patientId),
      { params }
    )
    return res.data
  },
}