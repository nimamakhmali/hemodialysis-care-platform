import apiClient from '@lib/api/client'
import { API_ENDPOINTS } from '@lib/api/endpoints'
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  ChangePasswordRequest,
  CurrentUserResponse,
  ApiResponse,
} from '@appTypes/api.types'

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
      API_ENDPOINTS.auth.login,
      credentials
    )
    return data.data
  },

  /**
   * منبع واحد حقیقت برای پروفایل کاربر جاری (شامل patient_profile).
   * هم بعد از login و هم در initialize صدا زده می‌شود تا هیچ‌وقت
   * user-state بدون اعتبارسنجی سرور ست نشود.
   */
  getMe: async (): Promise<CurrentUserResponse> => {
    const { data } = await apiClient.get<ApiResponse<CurrentUserResponse>>(
      API_ENDPOINTS.auth.me
    )
    return data.data
  },

  logout: async (refreshToken?: string | null): Promise<void> => {
    try {
      // refresh_token باید ارسال شود تا بک‌اند بتواند آن را هم
      // blacklist کند؛ در غیر این صورت بعد از logout همچنان معتبر می‌ماند.
      await apiClient.post(API_ENDPOINTS.auth.logout, {
        refresh_token: refreshToken ?? undefined,
      })
    } catch {
      // خطای logout نباید مانع پاک شدن state محلی شود
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