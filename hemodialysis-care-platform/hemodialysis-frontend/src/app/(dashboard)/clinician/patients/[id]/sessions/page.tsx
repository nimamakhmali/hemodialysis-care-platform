'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Plus, Activity } from 'lucide-react'
import { useSessions } from '@/features/dialysis-sessions/hooks/useSessions'
import { SessionList } from '@/features/dialysis-sessions/components/SessionList'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoader } from '@/components/feedback/PageLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { pageVariants } from '@/lib/animation/variants'

export default function PatientSessionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data, isLoading, isError } = useSessions(id)

  const sessions = data?.data ?? []

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <PageHeader
        title="جلسات دیالیز"
        description="تاریخچه جلسات دیالیز بیمار"
        action={
          <button
            onClick={() =>
              router.push(`/clinician/patients/${id}/sessions/new`)
            }
            className="flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" />
            جلسه جدید
          </button>
        }
      />

      {isLoading && <PageLoader />}

      {isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">خطا در دریافت جلسات</p>
        </div>
      )}

      {!isLoading && !isError && sessions.length === 0 && (
        <EmptyState
          icon={<Activity />}
          title="جلسه‌ای ثبت نشده"
          description="اولین جلسه دیالیز را ثبت کنید"
          action={{
            label: 'ثبت جلسه',
            onClick: () =>
              router.push(`/clinician/patients/${id}/sessions/new`),
          }}
        />
      )}

      {!isLoading && !isError && sessions.length > 0 && (
        <SessionList sessions={sessions} patientId={id} />
      )}
    </motion.div>
  )
}