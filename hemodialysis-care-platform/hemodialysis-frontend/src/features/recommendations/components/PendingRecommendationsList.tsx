'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { ClipboardList, Clock } from 'lucide-react'
import { usePendingRecommendations } from '../hooks/useRecommendations'
import { RecommendationReviewModal } from './RecommendationReviewModal'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { ALERT_SEVERITY_COLORS } from '@/config/constants'
import { formatDistanceToNow } from '@/lib/utils/date.utils'
import type { RecommendationItem } from '@/types/api.types'

export function PendingRecommendationsList() {
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<RecommendationItem | null>(null)

  const { data, isLoading, isError } = usePendingRecommendations()

  const recs = data?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-center text-sm text-red-500 py-8">
        خطا در دریافت توصیه‌ها
      </p>
    )
  }

  if (recs.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList />}
        title="توصیه‌ای در انتظار نیست"
        description="همه توصیه‌های سیستم بررسی شده‌اند"
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {recs.map((rec, i) => {
          const cfg = ALERT_SEVERITY_COLORS[rec.priority]
          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(rec)}
              className="cursor-pointer rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:border-[#BAE6FD] hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {rec.patient_name && (
                      <span className="text-xs font-medium text-slate-700">
                        {rec.patient_name}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.badge}`}
                    >
                      {rec.priority === 'high'
                        ? 'بحرانی'
                        : rec.priority === 'medium'
                        ? 'متوسط'
                        : 'کم'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {rec.draft_for_clinician}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(rec.created_at)}
                  </div>
                  <button className="rounded-lg bg-[#0EA5E9] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-[#0284C7]">
                    بررسی
                  </button>
                </div>
              </div>
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

      {selected && (
        <RecommendationReviewModal
          recommendation={selected}
          isOpen={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}