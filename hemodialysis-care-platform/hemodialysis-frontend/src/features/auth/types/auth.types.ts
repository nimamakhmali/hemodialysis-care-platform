import type { UserRole } from '@appTypes/common.types'

export interface AuthUser {
  id: string
  phone_number: string
  full_name: string
  role: UserRole
  is_active: boolean
}

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