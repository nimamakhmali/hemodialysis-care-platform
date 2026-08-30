'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@features/auth/stores/auth.store'
import type { UserRole } from '@appTypes/common.types'

// ─── Route Config ─────────────────────────────────────────────────────────
const PUBLIC_ROUTES = ['/login', '/']

const ROLE_HOME_MAP: Record<UserRole, string> = {
  patient: '/patient',
  clinician: '/clinician',
  admin: '/admin',
}

const ROLE_ALLOWED_PREFIXES: Record<UserRole, string[]> = {
  patient: ['/patient'],
  clinician: ['/clinician'],
  admin: ['/admin', '/clinician'],
}

// ─── Page Loader ─────────────────────────────────────────────────────────
function InitializingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-surface z-50">
      <div className="flex flex-col items-center gap-6">
        {/* Logo Mark */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-azure flex items-center justify-center shadow-glow">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935
                   0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733
                   -4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9
                   12 9 12s9-4.78 9-12z"
              />
            </svg>
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-2xl bg-primary-400/30 animate-ping-sm" />
        </div>

        {/* Brand */}
        <div className="text-center">
          <h2 className="text-lg font-bold text-text-primary">سامانه پایش دیالیز</h2>
          <p className="text-sm text-text-muted mt-1">در حال بارگذاری...</p>
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary-400 animate-pulse-soft"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Auth Provider ────────────────────────────────────────────────────────
interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, isInitialized, initialize } = useAuthStore()
  const initCalled = useRef(false)

  // Initialize once on mount
  useEffect(() => {
    if (!initCalled.current) {
      initCalled.current = true
      initialize()
    }
  }, [initialize])

  // Route guard
  useEffect(() => {
    if (!isInitialized) return

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

    // Not authenticated → redirect to login
    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login')
      return
    }

    // Authenticated on public route → redirect to role home
    if (isAuthenticated && isPublicRoute && user) {
      router.replace(ROLE_HOME_MAP[user.role])
      return
    }

    // Authenticated but wrong role path
    if (isAuthenticated && user && !isPublicRoute) {
      const allowedPrefixes = ROLE_ALLOWED_PREFIXES[user.role]
      const isAllowed = allowedPrefixes.some((prefix) => pathname.startsWith(prefix))

      if (!isAllowed) {
        router.replace(ROLE_HOME_MAP[user.role])
      }
    }
  }, [isAuthenticated, isInitialized, pathname, router, user])

  // Show loader while initializing
  if (!isInitialized) {
    return <InitializingScreen />
  }

  return <>{children}</>
}