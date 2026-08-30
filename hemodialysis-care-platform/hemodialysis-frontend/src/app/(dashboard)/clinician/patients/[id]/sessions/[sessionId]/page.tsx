// src/app/(dashboard)/clinician/patients/[id]/sessions/[sessionId]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { SessionDetail } from '@/features/dialysis-sessions/components/SessionDetail'
import { useSession } from '@/features/dialysis-sessions/hooks/useSessions'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'

export default function SessionDetailPage() {
  const { id: patientId, sessionId } = useParams<{
    id: string
    sessionId: string
  }>()

  const { data, isLoading, isError } = useSession(patientId, sessionId)
  const session = data?.data

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (isError || !session) {
    return (
      <div className="text-center py-16 text-text-muted">
        خطا در بارگذاری اطلاعات جلسه
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/clinician/patients/${patientId}/sessions`}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary-600
                     transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به جلسات</span>
        </Link>
      </div>

      <PageHeader title="جزئیات جلسه دیالیز" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <SessionDetail session={session} />
      </motion.div>
    </div>
  )
}