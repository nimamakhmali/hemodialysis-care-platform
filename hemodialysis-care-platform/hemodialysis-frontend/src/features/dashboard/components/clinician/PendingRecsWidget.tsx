'use client'

import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { ClipboardList, ChevronLeft, Clock } from 'lucide-react'
import type { Recommendation } from '@/features/recommendations/types/recommendation.types'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDistanceToNow } from '@/lib/utils/date.utils'

interface PendingRecsWidgetProps {
  recommendations: Recommendation[]
}

const PRIORITY_CONFIG = {
  high: { label: 'بحرانی', cls: 'bg-red-100 text-red-700' },
  medium: { label: 'متوسط', cls: 'bg-amber-100 text-amber-700' },
  low: { label: 'کم', cls: 'bg-slate-100 text-slate-600' },
}

export function PendingRecsWidget({ recommendations }: PendingRecsWidgetProps) {
  const router = useRouter()

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50">
            <ClipboardList className="h-4 w-4 text-violet-500" />
          </div>
          <h2 className="font-semibold text-slate-800 text-sm">
            توصیه‌های در انتظار
          </h2>
        </div>
        {recommendations.length > 0 && (
          <button
            onClick={() => router.push('/clinician/recommendations')}
            className="text-xs text-primary-500 hover:text-primary-600"
          >
            همه
          </button>
        )}
      </div>

      {/* Content */}
      {recommendations.length === 0 ? (
        <EmptyState
          title="توصیه‌ای در انتظار نیست"
          description="تمام توصیه‌ها بررسی شده‌اند"
          size="sm"
        />
      ) : (
        <div className="divide-y divide-slate-50 overflow-y-auto max-h-72">
          {recommendations.slice(0, 6).map((rec, i) => {
            const priority = PRIORITY_CONFIG[rec.priority]
            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => router.push('/clinician/recommendations')}
                className="
                  px-5 py-3.5 hover:bg-slate-50/70
                  cursor-pointer transition-colors group
                "
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {rec.patient_name ?? 'بیمار'}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${priority.cls}`}
                  >
                    {priority.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {rec.draft_for_clinician}
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock className="h-3 w-3 text-slate-300" />
                  <span className="text-[10px] text-slate-400">
                    {formatDistanceToNow(rec.created_at)}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}