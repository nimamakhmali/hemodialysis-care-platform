'use client'

import { PageLoader } from '@/components/feedback/PageLoader'
import { DietPageView } from '@/features/fluid-diet/components/DietPageView'
import { useRequirePatientId } from '@/features/auth/hooks/useRequirePatientId'

export default function PatientDietPage() {
  const { patientId, isReady } = useRequirePatientId()
  if (!isReady) return <PageLoader />
  return <DietPageView patientId={patientId} />
}