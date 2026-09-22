import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { ApiResponse, PaginatedApiResponse, EducationContentItem } from '@/types/api.types'

export const educationService = {
  getAll: async (params?: {
    page?: number
    size?: number
    search?: string
  }): Promise<PaginatedApiResponse<EducationContentItem>> => {
    const res = await apiClient.get(API_ENDPOINTS.education.list, { params })
    return res.data
  },

  getByTopic: async (topicCode: string): Promise<EducationContentItem> => {
    const res = await apiClient.get<ApiResponse<EducationContentItem>>(
      API_ENDPOINTS.education.detail(topicCode)
    )
    return res.data.data
  },

  getRelevant: async (patientId: string): Promise<EducationContentItem[]> => {
    const res = await apiClient.get<ApiResponse<EducationContentItem[]>>(
      API_ENDPOINTS.education.relevant(patientId)
    )
    return res.data.data ?? []
  },

  search: async (query: string): Promise<EducationContentItem[]> => {
    const res = await apiClient.get<ApiResponse<EducationContentItem[]>>(
      `${API_ENDPOINTS.education.list}search`,
      { params: { q: query } }
    )
    return res.data.data ?? []
  },

  // Admin only
  create: async (data: Partial<EducationContentItem>): Promise<EducationContentItem> => {
    const res = await apiClient.post<ApiResponse<EducationContentItem>>(
      API_ENDPOINTS.education.create,
      data
    )
    return res.data.data
  },

  update: async (
    id: string,
    data: Partial<EducationContentItem>
  ): Promise<EducationContentItem> => {
    const res = await apiClient.put<ApiResponse<EducationContentItem>>(
      API_ENDPOINTS.education.update(id),
      data
    )
    return res.data.data
  },
}