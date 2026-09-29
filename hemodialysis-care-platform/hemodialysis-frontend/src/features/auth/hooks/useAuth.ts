'use client'

import { useAuthStore } from '../stores/auth.store'
import type { CurrentUser } from '@/types/api.types'

export interface UseAuthResult {
  user: CurrentUser | null
  isAuthenticated: boolean
  isInitializing: boolean
  isLoading: boolean
  login: (data: { phone_number: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: CurrentUser) => void
  clearAuth: () => void
}

/**
 * Hook مشترک دسترسی به وضعیت احراز هویت.
 * از Zustand store استفاده می‌کند تا performance بهینه باشد
 * (فقط بخش‌هایی که نیاز دارند re-render شوند).
 */
export function useAuth(): UseAuthResult {
  const {
    user,
    isAuthenticated,
    isInitializing,
    isLoading,
    login,
    logout,
    setUser,
    clearAuth,
  } = useAuthStore((s) => ({
    user: s.user,
    isAuthenticated: s.isAuthenticated,
    isInitializing: s.isInitializing,
    isLoading: s.isLoading,
    login: s.login,
    logout: s.logout,
    setUser: s.setUser,
    clearAuth: s.clearAuth,
  }))

  return {
    user,
    isAuthenticated,
    isInitializing,
    isLoading,
    login,
    logout,
    setUser,
    clearAuth,
  }
}

export default useAuth