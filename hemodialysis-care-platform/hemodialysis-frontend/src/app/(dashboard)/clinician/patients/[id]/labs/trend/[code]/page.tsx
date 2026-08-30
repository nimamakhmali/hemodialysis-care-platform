// src/app/(dashboard)/clinician/patients/[id]/labs/trend/[code]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { LabTrendChart } from '@/features/lab-results/components/LabTrendChart'
import { useLabTrend } from '@/features/lab-results/hooks/useLabResults'
import { Skeleton } from '@/components/ui/Skeleton'
import { LAB_NAMES_FA } from '@/config/constants'
import type { LabTestCode } from '@/types/common.types'

export default function LabTrendPage() {
  const { id: patientId, code } = useParams<{ id: string; code: string }>()
  const { data, isLoading, isError } = useLabTrend(patientId, code)

  const nameFa = LAB_NAMES_FA[code as LabTestCode] ?? code

  return (
    <div className="space-y-6">
      <Link href={`/clinician/patients/${patientId}/labs`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors">
        <ArrowRight className="w-4 h-4" />
        بازگشت
      </Link>

      <div>
        <h1 className="text-2xl font-black text-slate-800">روند {nameFa}</h1>
        <p className="text-slate-500 text-sm mt-1">تحلیل تغییرات در طول زمان</p>
      </div>

      {isLoading && <Skeleton className="h-96 rounded-2xl" />}

      {isError && (
        <div className="text-center py-16 text-slate-400">داده‌ای برای نمایش وجود ندارد</div>
      )}

      {data?.data && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <LabTrendChart data={data.data} testCode={code} />
        </motion.div>
      )}
    </div>
  )
}