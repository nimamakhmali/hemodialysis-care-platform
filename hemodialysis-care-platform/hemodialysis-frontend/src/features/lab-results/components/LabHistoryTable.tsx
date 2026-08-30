// src/features/lab-results/components/LabHistoryTable.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown, ChevronLeft, FlaskConical, AlertTriangle } from 'lucide-react'
import { LabStatusBadge } from './LabStatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { LAB_NAMES_FA } from '@/config/constants'
import type { LabPanel } from '../types/lab.types'
import type { LabTestCode } from '@/types/common.types'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'

interface Props {
  panels: LabPanel[]
  patientId: string
  isLoading?: boolean
}

function PanelRow({ panel, patientId, index }: { panel: LabPanel; patientId: string; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="border border-primary-100 rounded-2xl overflow-hidden bg-white hover:border-primary-200 transition-colors"
    >
      {/* Row Header */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
          <FlaskConical className="w-4 h-4 text-primary-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-slate-800 text-sm">{panel.collected_at}</span>
            {panel.critical_count > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                {panel.critical_count} بحرانی
              </span>
            )}
            {panel.abnormal_count > 0 && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                {panel.abnormal_count} غیرطبیعی
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{panel.results.length} آزمایش ثبت شده</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={`/clinician/patients/${patientId}/labs/${panel.id}`}
            onClick={(e) => e.stopPropagation()}
            className="hidden sm:flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors"
          >
            جزئیات
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </motion.div>
        </div>
      </div>

      {/* Expanded results */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-5 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {panel.results.map((result) => (
                  <div
                    key={result.test_code}
                    className={cn(
                      'rounded-xl p-3 border text-center',
                      result.is_critical ? 'bg-red-50 border-red-200' :
                      result.is_abnormal ? 'bg-amber-50 border-amber-200' :
                      'bg-slate-50 border-slate-200'
                    )}
                  >
                    <p className="text-xs text-slate-500 mb-0.5">{LAB_NAMES_FA[result.test_code as LabTestCode] ?? result.test_code}</p>
                    <p className={cn(
                      'font-bold text-sm',
                      result.is_critical ? 'text-red-700' :
                      result.is_abnormal ? 'text-amber-700' :
                      'text-slate-700'
                    )}>
                      {result.value}
                    </p>
                    <p className="text-xs text-slate-400">{result.unit}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function LabHistoryTable({ panels, patientId, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (!panels.length) {
    return (
      <EmptyState
        icon={<FlaskConical className="w-10 h-10 text-primary-300" />}
        title="تاریخچه آزمایشی وجود ندارد"
        description="اولین پنل آزمایشگاهی را ثبت کنید"
      />
    )
  }

  return (
    <div className="space-y-3">
      {panels.map((panel, i) => (
        <PanelRow key={panel.id} panel={panel} patientId={patientId} index={i} />
      ))}
    </div>
  )
}