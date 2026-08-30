// src/app/(dashboard)/clinician/patients/[id]/labs/[panelId]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight, FlaskConical } from 'lucide-react'
import { LabSummaryGrid } from '@/features/lab-results/components/LabSummaryGrid'
import { useLabPanelDetail, useReferenceRanges } from '@/features/lab-results/hooks/useLabResults'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'

export default function LabPanelDetailPage() {
  const { id: patientId, panelId } = useParams<{ id: string; panelId: string }>()
  const { data, isLoading } = useLabPanelDetail(patientId, panelId)
  const { data: refsData } = useReferenceRanges()

  const panel = data?.data
  const refRanges = refsData?.data ?? []

  return (
    <div className="space-y-6">
      <Link href={`/clinician/patients/${patientId}/labs`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors">
        <ArrowRight className="w-4 h-4" />
        بازگشت به آزمایش‌ها
      </Link>

      <PageHeader title="جزئیات پنل آزمایشگاهی" description={panel ? `تاریخ: ${panel.collected_at}` : ''} />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <LabSummaryGrid panel={panel} refRanges={refRanges} />
        </motion.div>
      )}
    </div>
  )
}