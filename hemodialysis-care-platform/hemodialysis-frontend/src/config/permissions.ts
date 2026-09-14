import type { UserRole } from '@appTypes/common.types'

// ─── Route Guarding (منبع واحد — AuthProvider هم از همین‌جا می‌خواند) ──────
export const PUBLIC_ROUTES: readonly string[] = ['/login', '/']

export const ROLE_HOME_MAP: Record<UserRole, string> = {
  patient: '/patient',
  clinician: '/clinician',
  admin: '/admin',
}

export const ROLE_ALLOWED_PREFIXES: Record<UserRole, string[]> = {
  patient: ['/patient'],
  clinician: ['/clinician'],
  admin: ['/admin', '/clinician'],
}

export function canAccessPath(role: UserRole, pathname: string): boolean {
  return ROLE_ALLOWED_PREFIXES[role].some((prefix) => pathname.startsWith(prefix))
}

// ─── Role Checks ────────────────────────────────────────────────────────
export const isPatientRole = (role?: UserRole | null) => role === 'patient'
export const isClinicianRole = (role?: UserRole | null) => role === 'clinician'
export const isAdminRole = (role?: UserRole | null) => role === 'admin'
export const isClinicalStaff = (role?: UserRole | null) =>
  role === 'clinician' || role === 'admin'

// ─── Feature-level Capability Gates (فقط UX — مرز امنیتی واقعی بک‌اند است) ──
export const canManagePatients = (role?: UserRole | null) => isClinicalStaff(role)
export const canRecordClinicalData = (role?: UserRole | null) =>
  isClinicalStaff(role) // ثبت جلسه دیالیز / آزمایش
export const canReviewRecommendations = (role?: UserRole | null) =>
  isClinicalStaff(role)
export const canAcknowledgeAlerts = (role?: UserRole | null) => isClinicalStaff(role)
export const canManageEducationContent = (role?: UserRole | null) =>
  role === 'admin'
export const canManageUsers = (role?: UserRole | null) => role === 'admin'
export const canViewAuditLogs = (role?: UserRole | null) => role === 'admin'

// خودگزارش‌دهی — فقط بیمار
export const canSelfReport = (role?: UserRole | null) => role === 'patient'