import { create } from 'zustand'
import { authService } from '../services/auth.service'
import type { AuthStore, LoginCredentials } from '../types/auth.types'

export const useAuthStore = create<AuthStore>((set, get) => ({
  // ─── State ──────────────────────────────────────────────────────
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  // ─── Actions ────────────────────────────────────────────────────
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true })
    try {
      const response = await authService.login(credentials)

      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('refresh_token', response.refresh_token)

      // پاسخ login فقط اطلاعات مینیمال کاربر را دارد (بدون patient_profile).
      // بلافاصله /auth/me را صدا می‌زنیم تا پروفایل کامل (و patient_id) هیدرات شود.
      const me = await authService.getMe()

      set({ user: me, isAuthenticated: true, isLoading: false })
    } catch (error) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({ user: null, isAuthenticated: false, isLoading: false })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })
    const refreshToken = localStorage.getItem('refresh_token')
    try {
      await authService.logout(refreshToken)
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  initialize: async () => {
    if (get().isInitialized) return

    const accessToken = localStorage.getItem('access_token')

    if (!accessToken) {
      set({ isInitialized: true, isAuthenticated: false, user: null })
      return
    }

    try {
      // اعتبارسنجی واقعی توکن با سرور — نه فرض کورکورانه
      const me = await authService.getMe()
      set({ user: me, isAuthenticated: true, isInitialized: true })
      return
    } catch {
      // access token نامعتبر/منقضی — تلاش برای refresh
    }

    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      localStorage.removeItem('access_token')
      set({ user: null, isAuthenticated: false, isInitialized: true })
      return
    }

    try {
      const refreshed = await authService.refreshToken(refreshToken)
      localStorage.setItem('access_token', refreshed.access_token)

      const me = await authService.getMe()
      set({ user: me, isAuthenticated: true, isInitialized: true })
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({ user: null, isAuthenticated: false, isInitialized: true })
    }
  },
}))

// ─── Selectors ────────────────────────────────────────────────────────────
export const selectUser = (state: AuthStore) => state.user
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated
export const selectIsLoading = (state: AuthStore) => state.isLoading
export const selectUserRole = (state: AuthStore) => state.user?.role
export const selectIsPatient = (state: AuthStore) => state.user?.role === 'patient'
export const selectIsClinician = (state: AuthStore) =>
  state.user?.role === 'clinician'
export const selectIsAdmin = (state: AuthStore) => state.user?.role === 'admin'

/**
 * تنها منبع صحیح patient_id برای کاربر بیمار.
 * هرگز از user.id به‌جای این استفاده نکنید.
 */
export const selectPatientId = (state: AuthStore) =>
  state.user?.patient_profile?.patient_id ?? null