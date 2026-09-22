import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { ApiResponse, PaginatedApiResponse } from '@/types/api.types'
import type { PatientMessageItem } from '@/types/api.types'

export const messagesService = {
  getMessages: async (
    patientId: string,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedApiResponse<PatientMessageItem>> => {
    const res = await apiClient.get(
      API_ENDPOINTS.messages.list(patientId),
      { params }
    )
    return res.data
  },

  markRead: async (messageId: string): Promise<void> => {
    await apiClient.put(API_ENDPOINTS.messages.read(messageId))
  },

  markAllRead: async (patientId: string): Promise<void> => {
    await apiClient.put(API_ENDPOINTS.messages.readAll(patientId))
  },

  getUnreadCount: async (patientId: string): Promise<number> => {
    const res = await apiClient.get<ApiResponse<{ unread_count: number }>>(
      API_ENDPOINTS.messages.unreadCount(patientId)
    )
    return (
      res.data?.data?.unread_count ??
      (res.data?.data as unknown as { count?: number })?.count ??
      0
    )
  },
}