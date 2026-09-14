'use client'

import { useRequirePatientId } from '@/features/auth/hooks/useRequirePatientId'
import { MessagesPageView } from '@/features/messages/components/MessagesPageView'
import { PageLoader } from '@/components/feedback/PageLoader'
import { EmptyState } from '@/components/ui/EmptyState'

export default function MessagesPage() {
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

  return <MessagesPageView patientId={patientId} />
}