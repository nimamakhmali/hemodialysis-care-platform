import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { ClinicianDashboardData } from '../types/clinician-dashboard.types'
import type { ApiResponse } from '@/types/api.types'

export const clinicianDashboardService = {
  getDashboard: async (): Promise<ClinicianDashboardData> => {
    const res = await apiClient.get<ApiResponse<ClinicianDashboardData>>(
      API_ENDPOINTS.clinician.dashboard
    )
    return res.data.data
  },
}