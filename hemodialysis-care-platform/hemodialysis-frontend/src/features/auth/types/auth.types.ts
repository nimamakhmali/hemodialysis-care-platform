import type { UserRole } from '@appTypes/common.types'
import type { CurrentUserResponse } from '@appTypes/api.types'

export interface PatientProfileRef {
  patient_id: string
  medical_record_number: string
}

/**
 * AuthUser دقیقاً هم‌شکل با پاسخ /auth/me است
 * (تنها منبع حقیقت برای پروفایل کاربر جاری)
 */
export type AuthUser = CurrentUserResponse

export interface LoginCredentials {
  phone_number: string
  password: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
}

export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
  setUser: (user: AuthUser | null) => void
}

export type AuthStore = AuthState & AuthActions