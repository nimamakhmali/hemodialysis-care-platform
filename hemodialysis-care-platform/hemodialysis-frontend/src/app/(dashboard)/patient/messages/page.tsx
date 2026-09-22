'use client'

import { PageLoader } from '@/components/feedback/PageLoader'
import { MessagesPageView } from '@/features/messages/components/MessagesPageView'
import { useRequirePatientId } from '@/features/auth/hooks/useRequirePatientId'

export default function PatientMessagesPage() {
  const { patientId, isReady } = useRequirePatientId()
  if (!isReady) return <PageLoader />
  return <MessagesPageView patientId={patientId} />
}