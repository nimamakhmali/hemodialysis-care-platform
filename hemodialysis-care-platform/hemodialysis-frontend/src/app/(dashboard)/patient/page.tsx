'use client'

import { useRequirePatientId } from '@/features/auth/hooks/useRequirePatientId'
import { PatientDashboard } from '@/features/dashboard/components/patient/PatientDashboard'
import { PageLoader } from '@/components/feedback/PageLoader'
import { EmptyState } from '@/components/ui/EmptyState'

export default function PatientPage() {
  const { patientId, isReady, hasProfile } = useRequirePatientId()

  if (!isReady) return <PageLoader />

  if (!hasProfile || !patientId) {
    return (
      <EmptyState
        title="پرونده بیمار یافت نشد"
        description="حساب کاربری شما به هیچ پرونده بیمار متصل نیست. لطفاً با مرکز درمانی تماس بگیرید."
      />
    )
  }

  return <PatientDashboard patientId={patientId} />
}