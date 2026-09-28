'use client'

import { motion } from 'motion/react'
import { PendingRecommendationsList } from '@/features/recommendations/components/PendingRecommendationsList'
import { PageHeader } from '@/components/layout/PageHeader'
import { pageVariants } from '@/lib/animation/variants'
import { usePendingRecommendations } from '@/features/recommendations/hooks/useRecommendations'

export default function ClinicianRecommendationsPage() {
  const { data } = usePendingRecommendations()
  const count = data?.total ?? 0

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      <PageHeader
        title="توصیه‌ها"
        description={
          count > 0
            ? `${count} توصیه در انتظار بررسی`
            : 'بررسی و تأیید توصیه‌های سیستم'
        }
      />
      <PendingRecommendationsList />
    </motion.div>
  )
}