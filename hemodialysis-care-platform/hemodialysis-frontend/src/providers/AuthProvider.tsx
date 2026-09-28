'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/features/auth/stores/auth.store'

/**
 * Runs once on app startup.
 * Validates the stored token via /auth/me before rendering children.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    initialize()
  }, [initialize])

  return <>{children}</>
}