'use client'

import { motion } from 'motion/react'
import { FlaskConical } from 'lucide-react'
import type { PatientDashboard } from '@/types/api.types'
import type { HealthStatus, LabTestCode } from '@/types/common.types'
import { formatShortDate } from '@/lib/utils/date.utils'

interface LabSummarySectionProps {
  labSummary: PatientDashboard['lab_summary']
}

const LAB_LABELS: Partial<Record<LabTestCode, string>> = {
  K: 'پتاسیم',
  Na: 'سدیم',
  Hb: 'هموگلوبین',
  P: 'فسفر',
  Ca: 'کلسیم',
  Alb: 'آلبومین',
  CRP: 'CRP',
  PTH: 'PTH',
}

const STATUS_CONFIG: Record<HealthStatus, { dot: string; text: string }> = {
  ok: { dot: 'bg-emerald-500', text: 'text-emerald-700' },
  warning: { dot: 'bg-amber-500', text: 'text-amber-700' },
  critical: { dot: 'bg-red-500', text: 'text-red-700' },
  neutral: { dot: 'bg-slate-400', text: 'text-slate-600' },
  unknown: { dot: 'bg-slate-300', text: 'text-slate-400' },
}

export function LabSummarySection({ labSummary }: LabSummarySectionProps) {
  const entries = Object.entries(labSummary) as Array<
    [LabTestCode, { value: number; date: string; status: HealthStatus; unit: string }]
  >

  if (entries.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50">
          <FlaskConical className="h-4 w-4 text-primary-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">
          آخرین آزمایش‌ها
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {entries.map(([code, data], i) => {
          const label = LAB_LABELS[code] ?? code
          const statusConf = STATUS_CONFIG[data.status] ?? STATUS_CONFIG.unknown

          return (
            <motion.div
              key={code}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-slate-100 bg-slate-50/50 p-3"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`h-2 w-2 rounded-full ${statusConf.dot}`} />
                <span className="text-[11px] font-medium text-slate-500">
                  {label}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-base font-bold ${statusConf.text}`}>
                  {data.value}
                </span>
                <span className="text-[11px] text-slate-400">{data.unit}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {formatShortDate(data.date)}
              </p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}