import apiClient from '@lib/api/client'
import { API_ENDPOINTS } from '@lib/api/endpoints'
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  ChangePasswordRequest,
} from '@appTypes/api.types'
import type { ApiResponse } from '@appTypes/api.types'

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
      API_ENDPOINTS.auth.login,
      credentials
    )
    return data.data
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post(API_ENDPOINTS.auth.logout)
    } catch {
      // Ignore logout errors — clean local state regardless
    }
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const { data } = await apiClient.post<ApiResponse<RefreshTokenResponse>>(
      API_ENDPOINTS.auth.refresh,
      { refresh_token: refreshToken }
    )
    return data.data
  },

  changePassword: async (payload: ChangePasswordRequest): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.auth.changePassword, payload)
  },
}