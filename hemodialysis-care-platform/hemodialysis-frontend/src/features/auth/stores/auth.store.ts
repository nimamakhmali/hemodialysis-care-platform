import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { authService } from '../services/auth.service'
import type { AuthStore } from '../types/auth.types'
import type { LoginCredentials } from '../types/auth.types'

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // ─── State ──────────────────────────────────────────────────────
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      // ─── Actions ────────────────────────────────────────────────────
      setUser: (user) => {
        set({ user, isAuthenticated: !!user })
      },

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true })
        try {
          const response = await authService.login(credentials)

          localStorage.setItem('access_token', response.access_token)
          localStorage.setItem('refresh_token', response.refresh_token)

          set({
            user: response.user_info,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await authService.logout()
        } finally {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      initialize: async () => {
        if (get().isInitialized) return

        const accessToken = localStorage.getItem('access_token')
        const refreshToken = localStorage.getItem('refresh_token')

        if (!accessToken || !refreshToken) {
          set({ isInitialized: true, isAuthenticated: false, user: null })
          return
        }

        // User already persisted from previous session
        const persistedUser = get().user
        if (persistedUser) {
          set({ isInitialized: true, isAuthenticated: true })
          return
        }

        set({ isInitialized: true })
      },
    }),
    {
      name: 'hemodialysis-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// ─── Selectors ────────────────────────────────────────────────────────────
export const selectUser = (state: AuthStore) => state.user
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated
export const selectIsLoading = (state: AuthStore) => state.isLoading
export const selectUserRole = (state: AuthStore) => state.user?.role
export const selectIsPatient = (state: AuthStore) => state.user?.role === 'patient'
export const selectIsClinician = (state: AuthStore) =>
  state.user?.role === 'clinician'
export const selectIsAdmin = (state: AuthStore) => state.user?.role === 'admin'