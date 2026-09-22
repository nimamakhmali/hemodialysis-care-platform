'use client'

import { use, useState } from 'react'
import { motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { useSessions, useCreateSession } from '@/features/dialysis-sessions/hooks/useSessions'
import { SessionList } from '@/features/dialysis-sessions/components/SessionList'
import { SessionForm } from '@/features/dialysis-sessions/components/SessionForm'
import { PageHeader } from '@/components/layout/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { pageVariants } from '@/lib/animation/variants'
import { Activity } from 'lucide-react'
import type { SessionFormData } from '@/features/dialysis-sessions/types/session.types'

export default function PatientSessionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading, isError } = useSessions(id, { page, size: 10 })
  const createMutation = useCreateSession(id)

  const sessions = data?.data ?? []

  const handleSubmit = async (formData: SessionFormData) => {
    await createMutation.mutateAsync(formData)
    setShowForm(false)
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      <PageHeader
        title="جلسات دیالیز"
        description="تاریخچه جلسات دیالیز بیمار"
        action={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-[#0EA5E9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0284C7]"
          >
            <Plus className="h-4 w-4" />
            ثبت جلسه
          </button>
        }
      />

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-center text-red-500 text-sm py-8">
          خطا در دریافت جلسات
        </p>
      )}

      {!isLoading && !isError && sessions.length === 0 && (
        <EmptyState
          icon={<Activity />}
          title="جلسه‌ای ثبت نشده"
          description="اولین جلسه دیالیز این بیمار را ثبت کنید"
          action={
            <button
              onClick={() => setShowForm(true)}
              className="rounded-xl bg-[#0EA5E9] px-4 py-2 text-sm font-medium text-white"
            >
              ثبت جلسه اول
            </button>
          }
        />
      )}

      {!isLoading && sessions.length > 0 && (
        <SessionList sessions={sessions} patientId={id} />
      )}

      {data && data.pages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.pages}
          onPageChange={setPage}
        />
      )}

      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title="ثبت جلسه دیالیز"
          size="lg"
        >
          <SessionForm
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            isSubmitting={createMutation.isPending}
          />
        </Modal>
      )}
    </motion.div>
  )
}