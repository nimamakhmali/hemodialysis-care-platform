import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import apiClient, { tokenManager } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { CurrentUser, LoginRequest } from '@/types/api.types'

interface AuthState {
  user: CurrentUser | null
  isAuthenticated: boolean
  /** true during initial session restoration */
  isInitializing: boolean
  /** true while a login request is in-flight */
  isLoading: boolean

  login: (data: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
  setUser: (user: CurrentUser) => void
  clearAuth: () => void
}

// ── safe field extractors ───────────────────────────────────────────────────
function extractField<T>(
  obj: unknown,
  ...keys: string[]
): T | null {
  if (!obj || typeof obj !== 'object') return null
  const o = obj as Record<string, unknown>
  for (const key of keys) {
    if (o[key] !== undefined && o[key] !== null) return o[key] as T
  }
  // try nested data
  const nested = o.data
  if (nested && typeof nested === 'object') {
    const n = nested as Record<string, unknown>
    for (const key of keys) {
      if (n[key] !== undefined && n[key] !== null) return n[key] as T
    }
  }
  return null
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isInitializing: true,
      isLoading: false,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true })
        try {
          const res = await apiClient.post(
            API_ENDPOINTS.auth.login,
            credentials
          )
          const data = res.data

          // backend returns: { access_token, refresh_token, token_type, user }
          const accessToken = extractField<string>(
            data,
            'access_token'
          )
          const refreshToken = extractField<string>(
            data,
            'refresh_token'
          )
          // backend field is "user" — NOT "user_info"
          const user = extractField<CurrentUser>(data, 'user', 'user_info')

          if (!accessToken) {
            throw new Error('سرور توکن معتبر برنگرداند')
          }
          if (!user?.id) {
            throw new Error('سرور اطلاعات کاربر را برنگرداند')
          }

          tokenManager.setTokens(accessToken, refreshToken ?? undefined)
          set({ user, isAuthenticated: true, isInitializing: false, isLoading: false })
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      logout: async () => {
        try {
          await apiClient.post(API_ENDPOINTS.auth.logout)
        } catch {
          // ignore
        } finally {
          tokenManager.clearTokens()
          set({
            user: null,
            isAuthenticated: false,
            isInitializing: false,
          })
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
      },

      initialize: async () => {
        const token = tokenManager.getAccess()

        if (!token) {
          set({
            user: null,
            isAuthenticated: false,
            isInitializing: false,
          })
          return
        }

        try {
          const res = await apiClient.get(API_ENDPOINTS.auth.me)
          const user =
            extractField<CurrentUser>(res.data, 'user', 'data') ??
            (res.data as CurrentUser)

          if (!user?.id) throw new Error('invalid me response')

          // Refresh cookie TTL
          tokenManager.setTokens(token)
          set({ user, isAuthenticated: true, isInitializing: false })
        } catch {
          tokenManager.clearTokens()
          set({
            user: null,
            isAuthenticated: false,
            isInitializing: false,
          })
        }
      },

      setUser: (user) => set({ user, isAuthenticated: true }),

      clearAuth: () => {
        tokenManager.clearTokens()
        set({ user: null, isAuthenticated: false, isInitializing: false })
      },
    }),
    {
      name: 'dializ-auth',
      storage: createJSONStorage(() => localStorage),
      // only persist user so we can re-validate on startup
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
      // always start isInitializing=true even when rehydrating
      onRehydrateStorage: () => (state) => {
        if (state) state.isInitializing = true
      },
    }
  )
)