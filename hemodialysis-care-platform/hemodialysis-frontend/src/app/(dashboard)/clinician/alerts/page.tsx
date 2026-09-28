'use client'

import { motion } from 'motion/react'
import { AlertFeed } from '@/features/alerts/components/AlertFeed'
import { PageHeader } from '@/components/layout/PageHeader'
import { pageVariants } from '@/lib/animation/variants'

export default function ClinicianAlertsPage() {
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      <PageHeader
        title="هشدارها"
        description="هشدارهای تولید‌شده توسط سیستم تحلیل"
      />
      <AlertFeed />
    </motion.div>
  )
}