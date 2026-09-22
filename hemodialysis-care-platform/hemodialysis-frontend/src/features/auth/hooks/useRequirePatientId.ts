'use client'

import { useAuthStore } from '../stores/auth.store'

/**
 * برای صفحات بیمار — patient_id را از پروفایل کاربر برمی‌گرداند
 * توجه: user.id !== patient_profile.patient_id
 */
export function useRequirePatientId() {
  const user = useAuthStore((s) => s.user)

  const patientId = user?.patient_profile?.patient_id ?? ''
  const isReady = !!patientId

  return { patientId, isReady, user }
}