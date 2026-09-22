'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Activity } from 'lucide-react'
import { useSymptomHistory } from '../hooks/useSymptoms'
import {
  SYMPTOM_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  DANGER_SYMPTOMS,
} from '../types/symptom.types'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { formatDateTime } from '@/lib/utils/date.utils'

interface SymptomHistoryListProps {
  patientId: string
}

export function SymptomHistoryList({ patientId }: SymptomHistoryListProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useSymptomHistory(patientId, {
    page,
    size: 10,
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-center text-sm text-red-500 py-6">
        خطا در دریافت تاریخچه علائم
      </p>
    )
  }

  const reports = data?.data ?? []

  if (reports.length === 0) {
    return (
      <EmptyState
        icon={<Activity />}
        title="گزارشی ثبت نشده"
        description="هنوز هیچ علامتی گزارش نشده است"
        size="sm"
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {reports.map((report, i) => {
          const hasDanger = report.symptoms.some((s) =>
            DANGER_SYMPTOMS.has(s.type)
          )

          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl border p-4 ${
                hasDanger
                  ? 'border-red-200 bg-red-50'
                  : 'border-slate-100 bg-white'
              } shadow-sm`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500">
                  {formatDateTime(report.reported_at || report.created_at)}
                </p>
                {hasDanger && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                    ⚠️ علائم خطر
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {report.symptoms.map(({ type, severity }) => (
                  <span
                    key={type}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${SEVERITY_COLORS[severity]}`}
                  >
                    {SYMPTOM_LABELS[type]} · {SEVERITY_LABELS[severity]}
                  </span>
                ))}
              </div>

              {report.notes && (
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  {report.notes}
                </p>
              )}
            </motion.div>
          )
        })}
      </div>

      {data && data.pages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.pages}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}