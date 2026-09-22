// TODO: implement
'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { SessionForm } from '@/features/dialysis-sessions/components/SessionForm'
import { useCreateSession } from '@/features/dialysis-sessions/hooks/useSessions'
import { PageHeader } from '@/components/layout/PageHeader'
import { pageVariants } from '@/lib/animation/variants'
import type { SessionFormData } from '@/features/dialysis-sessions/types/session.types'

export default function NewSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { mutateAsync, isPending } = useCreateSession(id)

  const handleSubmit = async (data: SessionFormData) => {
    await mutateAsync(data)
    router.push(`/clinician/patients/${id}/sessions`)
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto space-y-6"
    >
      <PageHeader
        title="ثبت جلسه دیالیز"
        description="اطلاعات جلسه را وارد کنید"
      />
      <SessionForm
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        onCancel={() => router.push(`/clinician/patients/${id}/sessions`)}
      />
    </motion.div>
  )
}