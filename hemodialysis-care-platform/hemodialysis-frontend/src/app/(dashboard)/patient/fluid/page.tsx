'use client'

import { useRequirePatientId } from '@/features/auth/hooks/useRequirePatientId'
import { FluidPageView } from '@/features/fluid-diet/components/FluidPageView'
import { PageLoader } from '@/components/feedback/PageLoader'
import { EmptyState } from '@/components/ui/EmptyState'

export default function FluidPage() {
  const { patientId, isReady, hasProfile } = useRequirePatientId()

  if (!isReady) return <PageLoader />
  if (!hasProfile || !patientId) {
    return (
      <EmptyState
        title="پرونده بیمار یافت نشد"
        description="حساب کاربری شما به هیچ پرونده بیمار متصل نیست."
      />
    )
  }

  return <FluidPageView patientId={patientId} />
}