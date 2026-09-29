// src/app/(dashboard)/clinician/patients/[id]/labs/[panelId]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight, FlaskConical } from 'lucide-react'
import { useLabPanel, useReferenceRanges } from '@/features/lab-results/hooks/useLabResults'
import { LabResultCard } from '@/features/lab-results/components/LabResultCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatShortDate } from '@/lib/utils/date.utils'
import type { LabResultResponse } from '@/features/lab-results/types/lab.types'

export default function LabPanelDetailPage() {
  const { id: patientId, panelId } = useParams<{ id: string; panelId: string }>()
  const { data: panel, isLoading } = useLabPanel(patientId, panelId)
  const { data: refRanges } = useReferenceRanges()

  const refMap = new Map(refRanges?.map((r) => [r.test_code, r]))

  return (
    <div className="space-y-6">
      <Link href={`/clinician/patients/${patientId}/labs`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors">
        <ArrowRight className="w-4 h-4" />
        بازگشت به آزمایش‌ها
      </Link>

      <PageHeader
        title="جزئیات پنل آزمایشگاهی"
        description={panel ? `تاریخ: ${formatShortDate(panel.collected_at)}` : ''}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : !panel ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FlaskConical className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500">پنل آزمایشگاهی یافت نشد</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4">
          {/* Panel summary */}
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span>تاریخ: {formatShortDate(panel.collected_at)}</span>
            {panel.abnormal_count > 0 && (
              <span className="text-amber-600 font-medium">
                {panel.abnormal_count} مورد غیرنرمال
              </span>
            )}
            {panel.critical_count > 0 && (
              <span className="text-red-600 font-bold">
                ({panel.critical_count} بحرانی)
              </span>
            )}
          </div>

          {/* Results grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {panel.results.map((result: LabResultResponse, i: number) => (
              <LabResultCard
                key={result.id}
                result={result}
                refRange={refMap.get(result.test_code)}
                delay={i * 0.04}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}