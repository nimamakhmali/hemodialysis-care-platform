import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { ApiResponse } from '@/types/api.types'
import type { PatientDashboard } from '@/types/api.types'

export interface PatientTrendsData {
  weight_chart: Array<{
    date: string
    pre_weight: number
    dry_weight: number
    post_weight?: number
  }>
  bp_chart: Array<{
    date: string
    systolic?: number
    diastolic?: number
  }>
  lab_charts: Partial<Record<string, Array<{ date: string; value: number }>>>
}

export const patientDashboardService = {
  getDashboard: async (patientId: string): Promise<PatientDashboard> => {
    const res = await apiClient.get<ApiResponse<PatientDashboard>>(
      API_ENDPOINTS.patients.dashboard(patientId)
    )
    return res.data.data
  },

  getTrends: async (patientId: string): Promise<PatientTrendsData> => {
    const res = await apiClient.get<ApiResponse<PatientTrendsData>>(
      API_ENDPOINTS.patients.trends(patientId)
    )
    return res.data.data
  },
}