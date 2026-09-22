'use client'

import { motion } from 'motion/react'
import { ClipboardList, Clock, Eye } from 'lucide-react'
import type { Recommendation } from '../types/recommendation.types'
import { formatDistanceToNow } from '@/lib/utils/date.utils'
import { RecommendationStatusBadge } from './RecommendationStatusBadge'

interface RecommendationCardProps {
  recommendation: Recommendation
  onReview?: () => void
  showPatient?: boolean
}

const PRIORITY_CONFIG = {
  high: { border: 'border-red-200 hover:border-red-300', indicator: 'bg-red-500' },
  medium: { border: 'border-amber-200 hover:border-amber-300', indicator: 'bg-amber-400' },
  low: { border: 'border-slate-200 hover:border-slate-300', indicator: 'bg-slate-300' },
}

export function RecommendationCard({
  recommendation: rec,
  onReview,
  showPatient = true,
}: RecommendationCardProps) {
  const priority = PRIORITY_CONFIG[rec.priority]

  return (
    <div
      className={`
        relative rounded-2xl border bg-white p-5 shadow-sm
        transition-all duration-200
        ${priority.border}
      `}
    >
      {/* Priority indicator */}
      <div
        className={`absolute top-0 right-0 h-full w-1 rounded-r-2xl ${priority.indicator}`}
      />

      <div className="flex items-start justify-between gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <RecommendationStatusBadge status={rec.status} />
            {showPatient && rec.patient_name && (
              <span className="text-xs font-medium text-slate-700">
                {rec.patient_name}
              </span>
            )}
          </div>

          <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">
            {rec.draft_for_clinician}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-1.5 mt-3">
            <Clock className="h-3 w-3 text-slate-300" />
            <span className="text-[11px] text-slate-400">
              {formatDistanceToNow(rec.created_at)}
            </span>
          </div>
        </div>

        {/* Action */}
        {onReview && rec.status === 'draft' && (
          <button
            onClick={onReview}
            className="
              flex shrink-0 items-center gap-1.5 rounded-xl
              bg-primary-50 px-3 py-2 text-xs font-medium text-primary-600
              hover:bg-primary-100 transition-colors
            "
          >
            <Eye className="h-3.5 w-3.5" />
            بررسی
          </button>
        )}
      </div>
    </div>
  )
}