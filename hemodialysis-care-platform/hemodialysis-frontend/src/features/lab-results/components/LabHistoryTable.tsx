'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { ChevronLeft, AlertTriangle } from 'lucide-react'
import { useLabPanels } from '../hooks/useLabResults'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate } from '@/lib/utils/date.utils'

interface LabHistoryTableProps {
  patientId: string
}

export function LabHistoryTable({ patientId }: LabHistoryTableProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useLabPanels(patientId, {
    page,
    size: 10,
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-center text-sm text-red-500 py-6">
        خطا در دریافت تاریخچه آزمایش‌ها
      </p>
    )
  }

  const panels = data?.data ?? []

  if (panels.length === 0) {
    return (
      <EmptyState
        title="تاریخچه‌ای ثبت نشده"
        description="هنوز آزمایشی برای این بیمار ثبت نشده است"
        size="sm"
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-50 bg-slate-50/50">
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                تاریخ
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                تعداد آزمایش
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                وضعیت
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {panels.map((panel, i) => (
              <motion.tr
                key={panel.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="hover:bg-slate-50/70 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 font-medium text-slate-800">
                  {formatDate(panel.collected_at)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {panel.results.length} آزمایش
                </td>
                <td className="px-4 py-3">
                  {panel.critical_count > 0 && (
                    <span className="mr-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                      {panel.critical_count} بحرانی
                    </span>
                  )}
                  {panel.abnormal_count > 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                      {panel.abnormal_count} غیرنرمال
                    </span>
                  )}
                  {panel.abnormal_count === 0 && (
                    <span className="text-[11px] text-emerald-600">
                      ✓ همه نرمال
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ChevronLeft className="h-4 w-4 text-slate-300" />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
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