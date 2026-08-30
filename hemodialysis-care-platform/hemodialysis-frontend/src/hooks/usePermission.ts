import { useAuthStore } from '@features/auth/stores/auth.store'
import type { UserRole } from '@appTypes/common.types'

const ROLE_HIERARCHY: Record<UserRole, number> = {
  patient: 1,
  clinician: 2,
  admin: 3,
}

export function usePermission() {
  const user = useAuthStore((s) => s.user)

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false
    return roles.includes(user.role)
  }

  const hasMinRole = (minRole: UserRole): boolean => {
    if (!user) return false
    return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole]
  }

  const canAccessPatient = (patientUserId?: string): boolean => {
    if (!user) return false
    if (user.role === 'clinician' || user.role === 'admin') return true
    if (user.role === 'patient') return user.id === patientUserId
    return false
  }

  return {
    user,
    role: user?.role,
    isPatient: user?.role === 'patient',
    isClinician: user?.role === 'clinician',
    isAdmin: user?.role === 'admin',
    hasRole,
    hasMinRole,
    canAccessPatient,
    canManageUsers: hasRole('admin'),
    canApproveRecommendations: hasRole('clinician', 'admin'),
    canViewAllPatients: hasRole('clinician', 'admin'),
    canCreateSessions: hasRole('clinician', 'admin'),
    canCreateLabs: hasRole('clinician', 'admin'),
  }
}