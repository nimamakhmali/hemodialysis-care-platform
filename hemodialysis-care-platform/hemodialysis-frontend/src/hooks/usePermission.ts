'use client'

import { useAuthStore } from '@/features/auth/stores/auth.store'
import { hasPermission, hasAnyPermission, type Permission } from '@/config/permissions'

export function usePermission(permission: Permission): boolean {
  const role = useAuthStore((s) => s.user?.role)
  return hasPermission(role, permission)
}

export function useAnyPermission(permissions: Permission[]): boolean {
  const role = useAuthStore((s) => s.user?.role)
  return hasAnyPermission(role, permissions)
}

export function useRole() {
  return useAuthStore((s) => s.user?.role ?? null)
}