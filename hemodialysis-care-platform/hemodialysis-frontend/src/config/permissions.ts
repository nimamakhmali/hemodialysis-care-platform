import type { UserRole } from '@/types/common.types'

// ── Permission strings ──────────────────────────────────────────────────────
export type Permission =
  // Patients
  | 'patient:list'
  | 'patient:create'
  | 'patient:view'
  | 'patient:update'
  | 'patient:deactivate'
  // Sessions
  | 'session:create'
  | 'session:view'
  // Labs
  | 'lab:create'
  | 'lab:view'
  // Symptoms
  | 'symptom:create'
  | 'symptom:view'
  // Fluid / Diet
  | 'fluid:create'
  | 'fluid:view'
  | 'diet:create'
  | 'diet:view'
  // Alerts
  | 'alert:view'
  | 'alert:acknowledge'
  | 'alert:resolve'
  // Recommendations
  | 'recommendation:view'
  | 'recommendation:approve'
  | 'recommendation:reject'
  | 'recommendation:edit'
  // Messages
  | 'message:view'
  | 'message:send'
  // Education
  | 'education:view'
  | 'education:create'
  | 'education:update'
  | 'education:delete'
  // Admin
  | 'admin:users'
  | 'admin:audit'
  | 'admin:system'
  // Dashboard
  | 'dashboard:clinician'
  | 'dashboard:patient'
  | 'dashboard:admin'

// ── Role → Permission map ───────────────────────────────────────────────────
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'patient:list',
    'patient:create',
    'patient:view',
    'patient:update',
    'patient:deactivate',
    'session:create',
    'session:view',
    'lab:create',
    'lab:view',
    'symptom:create',
    'symptom:view',
    'fluid:create',
    'fluid:view',
    'diet:create',
    'diet:view',
    'alert:view',
    'alert:acknowledge',
    'alert:resolve',
    'recommendation:view',
    'recommendation:approve',
    'recommendation:reject',
    'recommendation:edit',
    'message:view',
    'message:send',
    'education:view',
    'education:create',
    'education:update',
    'education:delete',
    'admin:users',
    'admin:audit',
    'admin:system',
    'dashboard:clinician',
    'dashboard:admin',
  ],

  clinician: [
    'patient:list',
    'patient:create',
    'patient:view',
    'patient:update',
    'session:create',
    'session:view',
    'lab:create',
    'lab:view',
    'symptom:view',
    'fluid:view',
    'diet:view',
    'alert:view',
    'alert:acknowledge',
    'alert:resolve',
    'recommendation:view',
    'recommendation:approve',
    'recommendation:reject',
    'recommendation:edit',
    'message:view',
    'message:send',
    'education:view',
    'dashboard:clinician',
  ],

  patient: [
    'patient:view',      // own profile only
    'symptom:create',
    'symptom:view',
    'fluid:create',
    'fluid:view',
    'diet:create',
    'diet:view',
    'message:view',
    'education:view',
    'alert:view',        // own alerts only
    'session:view',      // own sessions only
    'lab:view',          // own labs only
    'dashboard:patient',
  ],
}

// ── Permission checker ──────────────────────────────────────────────────────
export function hasPermission(
  role: UserRole | null | undefined,
  permission: Permission
): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function hasAnyPermission(
  role: UserRole | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

export function hasAllPermissions(
  role: UserRole | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(role, p))
}

// ── Default redirect per role ───────────────────────────────────────────────
export function getDefaultRoute(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'clinician':
      return '/clinician'
    case 'patient':
    default:
      return '/patient'
  }
}