'use client'

import { motion } from 'motion/react'
import { ClipboardList } from 'lucide-react'
import { usePatientRecommendations } from '../hooks/useRecommendations'
import { RecommendationCard } from './RecommendationCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

interface PatientRecommendationsProps {
  patientId: string
}

export function PatientRecommendations({ patientId }: PatientRecommendationsProps) {
  const { data, isLoading, isError } = usePatientRecommendations(patientId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-center text-sm text-red-500 py-4">
        خطا در دریافت توصیه‌ها
      </p>
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList />}
        title="توصیه‌ای ثبت نشده"
        description="تاکنون هیچ توصیه‌ای برای این بیمار ثبت نشده است"
        size="sm"
      />
    )
  }

  return (
    <div className="space-y-3">
      {data.map((rec, i) => (
        <motion.div
          key={rec.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <RecommendationCard recommendation={rec} showPatient={false} />
        </motion.div>
      ))}
    </div>
  )
}