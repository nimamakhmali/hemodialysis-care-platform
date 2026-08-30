// src/features/lab-results/components/LabSummaryGrid.tsx
'use client'

import { motion } from 'motion/react'
import { FlaskConical } from 'lucide-react'
import { LabResultCard } from './LabResultCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import type { LabPanel, ReferenceRange } from '../types/lab.types'

interface Props {
  panel?: LabPanel | null
  refRanges?: ReferenceRange[]
  isLoading?: boolean
}

// گروه‌بندی آزمایش‌ها
const LAB_GROUPS = [
  { label: 'الکترولیت‌ها',     codes: ['K', 'Na', 'Ca', 'P'] },
  { label: 'خون',              codes: ['Hb', 'Hct'] },
  { label: 'التهاب و تغذیه',  codes: ['CRP', 'Alb'] },
  { label: 'آهن',              codes: ['Ferritin', 'TSAT'] },
  { label: 'متابولیک',         codes: ['PTH', 'Urea', 'Cr'] },
]

export function LabSummaryGrid({ panel, refRanges = [], isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (!panel || !panel.results?.length) {
    return (
      <EmptyState
        icon={<FlaskConical className="w-10 h-10 text-primary-300" />}
        title="آزمایشی ثبت نشده"
        description="اولین پنل آزمایشگاهی را ثبت کنید"
      />
    )
  }

  const refMap = Object.fromEntries(refRanges.map((r) => [r.test_code, r]))
  const resultMap = Object.fromEntries(panel.results.map((r) => [r.test_code, r]))

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 flex-wrap"
      >
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>تاریخ آزمایش:</span>
          <span className="font-medium text-slate-700">{panel.collected_at}</span>
        </div>
        {panel.critical_count > 0 && (
          <span className="px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {panel.critical_count} مورد بحرانی
          </span>
        )}
        {panel.abnormal_count > 0 && (
          <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
            {panel.abnormal_count} مورد غیرطبیعی
          </span>
        )}
      </motion.div>

      {/* Groups */}
      {LAB_GROUPS.map((group, gi) => {
        const groupResults = group.codes
          .map((code) => resultMap[code])
          .filter(Boolean)

        if (!groupResults.length) return null

        return (
          <div key={group.label}>
            <motion.h4
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: gi * 0.05 }}
              className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2"
            >
              <span className="w-4 h-px bg-primary-300 inline-block" />
              {group.label}
            </motion.h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {groupResults.map((result, ri) => (
                <LabResultCard
                  key={result.test_code}
                  result={result}
                  refRange={refMap[result.test_code]}
                  delay={gi * 0.05 + ri * 0.04}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}