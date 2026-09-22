'use client'

import { PageLoader } from '@/components/feedback/PageLoader'
import { SymptomsPageView } from '@/features/symptoms/components/SymptomsPageView'
import { useRequirePatientId } from '@/features/auth/hooks/useRequirePatientId'

export default function PatientSymptomsPage() {
  const { patientId, isReady } = useRequirePatientId()
  if (!isReady) return <PageLoader />
  return <SymptomsPageView patientId={patientId} />
}