'use client'

import { useAuthStore } from '../stores/auth.store'
import type { CurrentUser } from '@/types/api.types'

export interface CurrentPatientInfo {
  /** The patient profile ID — use this for all patient API calls */
  patientId: string
  userId: string
  user: CurrentUser
  isReady: boolean
}

/**
 * Canonical hook to get the current patient's profile ID.
 *
 * IMPORTANT: user.id !== patient_profile.patient_id
 * Always use patientId for patient-specific API endpoints.
 */
export function useCurrentPatient(): CurrentPatientInfo & { isReady: boolean } {
  const user = useAuthStore((s) => s.user)

  const patientId = user?.patient_profile?.patient_id ?? ''
  const isReady = !!user && !!patientId

  return {
    patientId,
    userId: user?.id ?? '',
    user: user!,
    isReady,
  }
}

/**
 * Guard: returns patientId if user is a patient with a valid profile.
 * Returns null if not a patient or no profile.
 */
export function useRequirePatientId(): {
  patientId: string
  isReady: boolean
} {
  const { patientId, isReady } = useCurrentPatient()
  return { patientId, isReady }
}