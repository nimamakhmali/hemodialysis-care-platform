'use client'

import { PageLoader } from '@/components/feedback/PageLoader'
import { FluidPageView } from '@/features/fluid-diet/components/FluidPageView'
import { useRequirePatientId } from '@/features/auth/hooks/useRequirePatientId'

export default function PatientFluidPage() {
  const { patientId, isReady } = useRequirePatientId()
  if (!isReady) return <PageLoader />
  return <FluidPageView patientId={patientId} />
}