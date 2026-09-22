'use client'

import { motion } from 'motion/react'
import { FlaskConical } from 'lucide-react'
import { useLatestLabs } from '../hooks/useLabResults'
import { LabStatusBadge } from './LabStatusBadge'
import { LAB_TEST_LABELS } from '../types/lab.types'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatShortDate } from '@/lib/utils/date.utils'

interface LabSummaryGridProps {
  patientId: string
}

export function LabSummaryGrid({ patientId }: LabSummaryGridProps) {
  const { data, isLoading, isError } = useLatestLabs(patientId)

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-red-500 text-center py-4">
        خطا در دریافت آزمایش‌ها
      </p>
    )
  }

  if (!data || data.results.length === 0) {
    return (
      <EmptyState
        icon={<FlaskConical />}
        title="آزمایشی ثبت نشده"
        description="هنوز نتیجه آزمایشی برای این بیمار ثبت نشده است"
        size="sm"
      />
    )
  }

  return (
    <div>
      <p className="text-xs text-slate-400 mb-3">
        تاریخ: {formatShortDate(data.collected_at)}
        {data.abnormal_count > 0 && (
          <span className="mr-2 text-amber-600 font-medium">
            {data.abnormal_count} مورد غیرنرمال
          </span>
        )}
        {data.critical_count > 0 && (
          <span className="mr-1 text-red-600 font-bold">
            ({data.critical_count} بحرانی)
          </span>
        )}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {data.results.map((result, i) => (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            className={`rounded-xl border p-3 ${
              result.is_critical
                ? 'border-red-200 bg-red-50'
                : result.is_abnormal
                ? 'border-amber-200 bg-amber-50'
                : 'border-slate-100 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-500">
                {result.test_name_fa || LAB_TEST_LABELS[result.test_code] || result.test_code}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-1.5">
              <span
                className={`text-base font-bold ${
                  result.is_critical
                    ? 'text-red-700'
                    : result.is_abnormal
                    ? 'text-amber-700'
                    : 'text-slate-800'
                }`}
              >
                {result.value}
              </span>
              <span className="text-[11px] text-slate-400">{result.unit}</span>
            </div>
            <LabStatusBadge
              isAbnormal={result.is_abnormal}
              isCritical={result.is_critical}
              direction={result.abnormality_direction}
            />
            {(result.ref_range_low != null || result.ref_range_high != null) && (
              <p className="text-[10px] text-slate-400 mt-1">
                نرمال: {result.ref_range_low}–{result.ref_range_high}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}