'use client'

import { useCallback } from 'react'
import { useAuthStore } from '../stores/auth.store'
import type { LoginCredentials } from '../types/auth.types'

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    login: storeLogin,
    logout: storeLogout,
  } = useAuthStore()

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      await storeLogin(credentials)
    },
    [storeLogin]
  )

  const logout = useCallback(async () => {
    await storeLogout()
  }, [storeLogout])

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    login,
    logout,
    isPatient: user?.role === 'patient',
    isClinician: user?.role === 'clinician',
    isAdmin: user?.role === 'admin',
    fullName: user?.full_name ?? '',
    role: user?.role,
  }
}