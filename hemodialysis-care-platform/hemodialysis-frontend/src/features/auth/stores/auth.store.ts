import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { CurrentUser, LoginRequest, LoginResponse } from '@/types/api.types'

interface AuthState {
  user: CurrentUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  restoreSession: () => Promise<void>
  setUser: (user: CurrentUser) => void
}

// ── Cookie helper (برای middleware) ──────────────────────────────────────
function setCookie(name: string, value: string, days = 1) {
  if (typeof document === 'undefined') return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
}

// ── Extract user from various response shapes ────────────────────────────
function extractUser(responseData: unknown): CurrentUser | null {
  const data = responseData as Record<string, unknown>

  // shape: { user: {...} }
  if (data?.user && typeof data.user === 'object') {
    return data.user as CurrentUser
  }
  // shape: { data: { user: {...} } }
  const inner = data?.data as Record<string, unknown> | undefined
  if (inner?.user && typeof inner.user === 'object') {
    return inner.user as CurrentUser
  }
  // shape: { user_info: {...} } — legacy
  if (data?.user_info && typeof data.user_info === 'object') {
    return data.user_info as CurrentUser
  }
  return null
}

function extractToken(
  responseData: unknown,
  key: 'access_token' | 'refresh_token'
): string | null {
  const data = responseData as Record<string, unknown>
  if (typeof data?.[key] === 'string') return data[key] as string
  const inner = data?.data as Record<string, unknown> | undefined
  if (typeof inner?.[key] === 'string') return inner[key] as string
  return null
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (credentials: LoginRequest) => {
        const res = await apiClient.post(API_ENDPOINTS.auth.login, credentials)
        const responseData = res.data

        const accessToken = extractToken(responseData, 'access_token')
        const refreshToken = extractToken(responseData, 'refresh_token')
        const user = extractUser(responseData)

        if (!accessToken || !user) {
          throw new Error('پاسخ نامعتبر از سرور')
        }

        // localStorage برای API calls
        localStorage.setItem('access_token', accessToken)
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken)
        }

        // Cookie برای middleware
        setCookie('access_token', accessToken, 1)

        set({ user, isAuthenticated: true, isLoading: false })
      },

      logout: async () => {
        try {
          await apiClient.post(API_ENDPOINTS.auth.logout)
        } catch {
          // Ignore
        } finally {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          deleteCookie('access_token')
          set({ user: null, isAuthenticated: false, isLoading: false })
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
      },

      restoreSession: async () => {
        const token = localStorage.getItem('access_token')

        if (!token) {
          set({ isLoading: false, isAuthenticated: false, user: null })
          return
        }

        try {
          const res = await apiClient.get(API_ENDPOINTS.auth.me)
          const user = extractUser(res.data) ?? (res.data as CurrentUser)

          if (user?.id) {
            // Refresh cookie
            setCookie('access_token', token, 1)
            set({ user, isAuthenticated: true, isLoading: false })
          } else {
            throw new Error('Invalid user')
          }
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          deleteCookie('access_token')
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      },

      setUser: (user: CurrentUser) => {
        set({ user, isAuthenticated: true })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)