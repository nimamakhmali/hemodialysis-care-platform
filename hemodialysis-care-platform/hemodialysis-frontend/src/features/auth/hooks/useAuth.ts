'use client'

import { useAuth } from './useAuth'

interface UseRequirePatientIdResult {
  patientId: string | null
  isReady: boolean
  hasProfile: boolean
}

/**
 * Guard مشترک برای تمام صفحات بیمار.
 * منبع صحیح patientId را از پروفایل اعتبارسنجی‌شده‌ی سرور (/auth/me) می‌گیرد
 * — هرگز از User.id استفاده نمی‌کند.
 */
export function useRequirePatientId(): UseRequirePatientIdResult {
  const { patientId, isInitialized, isAuthenticated } = useAuth()

  return {
    patientId,
    isReady: isInitialized && isAuthenticated,
    hasProfile: !!patientId,
  }
}