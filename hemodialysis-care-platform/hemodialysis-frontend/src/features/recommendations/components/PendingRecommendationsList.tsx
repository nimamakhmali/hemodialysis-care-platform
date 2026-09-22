'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ClipboardList } from 'lucide-react'
import {
  usePendingRecommendations,
  useApproveRecommendation,
  useRejectRecommendation,
} from '../hooks/useRecommendations'
import { RecommendationCard } from './RecommendationCard'
import { RecommendationReviewModal } from './RecommendationReviewModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Recommendation } from '../types/recommendation.types'

export function PendingRecommendationsList() {
  const { data: recs, isLoading, isError } = usePendingRecommendations()
  const [selected, setSelected] = useState<Recommendation | null>(null)

  const { mutateAsync: approve, isPending: approving } = useApproveRecommendation()
  const { mutateAsync: reject, isPending: rejecting } = useRejectRecommendation()

  const handleApprove = async (
    id: string,
    patientContent?: string
  ) => {
    await approve({ id, data: { patient_content: patientContent } })
    setSelected(null)
  }

  const handleReject = async (id: string, reason: string) => {
    await reject({ id, data: { reason } })
    setSelected(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">خطا در دریافت توصیه‌ها</p>
      </div>
    )
  }

  if (!recs || recs.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList />}
        title="توصیه‌ای در انتظار نیست"
        description="تمام توصیه‌های سیستم بررسی شده‌اند"
      />
    )
  }

  return (
    <>
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {recs.map((rec, i) => (
            <motion.div
              key={rec.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.06 }}
            >
              <RecommendationCard
                recommendation={rec}
                onReview={() => setSelected(rec)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {selected && (
        <RecommendationReviewModal
          recommendation={selected}
          onClose={() => setSelected(null)}
          onApprove={(content) => handleApprove(selected.id, content)}
          onReject={(reason) => handleReject(selected.id, reason)}
          isApproving={approving}
          isRejecting={rejecting}
        />
      )}
    </>
  )
}