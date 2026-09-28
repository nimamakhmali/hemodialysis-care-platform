'use client'

import { useState } from 'react'
import { usePatientRecommendations } from '../hooks/useRecommendations'
import { RECOMMENDATION_STATUS_FA } from '@/types/common.types'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { RecommendationReviewModal } from './RecommendationReviewModal'
import { formatDateTime } from '@/lib/utils/date.utils'
import { ALERT_SEVERITY_COLORS } from '@/config/constants'
import type { RecommendationItem } from '@/types/api.types'
import { ClipboardList, ChevronLeft } from 'lucide-react'

interface Props {
  patientId: string
}

export function PatientRecommendations({ patientId }: Props) {
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<RecommendationItem | null>(null)

  const { data, isLoading, isError } = usePatientRecommendations(patientId, {
    page,
    size: 10,
  })

  const recs = data?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-center text-sm text-red-500 py-6">
        خطا در دریافت توصیه‌ها
      </p>
    )
  }

  if (recs.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList />}
        title="توصیه‌ای وجود ندارد"
        size="sm"
      />
    )
  }

  return (
    <div className="space-y-3">
      {recs.map((rec) => {
        const cfg = ALERT_SEVERITY_COLORS[rec.priority]
        const isDraft = rec.status === 'draft'

        return (
          <div
            key={rec.id}
            onClick={() => !isDraft && setSelected(rec)}
            className={`rounded-2xl border p-4 ${
              isDraft
                ? 'border-slate-100 bg-slate-50 opacity-70'
                : 'border-slate-100 bg-white cursor-pointer hover:border-[#BAE6FD] hover:shadow-sm transition-all'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.badge}`}
                >
                  {rec.priority === 'high' ? 'بحرانی' : rec.priority === 'medium' ? 'متوسط' : 'کم'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {RECOMMENDATION_STATUS_FA[rec.status]}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {formatDateTime(rec.created_at)}
              </span>
            </div>

            {rec.status === 'approved' || rec.status === 'edited' ? (
              <p className="text-sm text-slate-700 leading-relaxed">
                {rec.patient_content}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                {isDraft
                  ? 'در انتظار بررسی پزشک'
                  : 'توصیه رد شد'}
              </p>
            )}
          </div>
        )
      })}

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