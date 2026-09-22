'use client'

import { PageLoader } from '@/components/feedback/PageLoader'
import { PatientDashboard } from '@/features/dashboard/components/patient/PatientDashboard'
import { useRequirePatientId } from '@/features/auth/hooks/useRequirePatientId'

export default function PatientPage() {
  const { patientId, isReady } = useRequirePatientId()

  if (!isReady) return <PageLoader />

  return <PatientDashboard patientId={patientId} />
}