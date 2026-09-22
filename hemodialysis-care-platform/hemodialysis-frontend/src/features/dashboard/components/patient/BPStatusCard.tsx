'use client'

import { motion } from 'motion/react'
import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { PatientDashboard } from '@/types/api.types'
import type { HealthStatus } from '@/types/common.types'

interface BPStatusCardProps {
  bpSummary: PatientDashboard['bp_summary']
}

const STATUS_CONFIG: Record<HealthStatus, {
  label: string; bg: string; text: string; border: string
}> = {
  ok: { label: 'مناسب', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  warning: { label: 'هشدار', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  critical: { label: 'بحرانی', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  neutral: { label: 'عادی', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  unknown: { label: 'نامشخص', bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-200' },
}

export function BPStatusCard({ bpSummary }: BPStatusCardProps) {
  const status = STATUS_CONFIG[bpSummary.status] ?? STATUS_CONFIG.unknown
  const bp = bpSummary.last_pre

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className={`rounded-2xl border p-5 ${status.bg} ${status.border}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70">
            <Heart className={`h-5 w-5 ${status.text}`} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">فشار خون</p>
            <span className={`text-xs font-semibold ${status.text}`}>
              {status.label}
            </span>
          </div>
        </div>
        {bpSummary.trend === 'increasing' ? (
          <TrendingUp className="h-4 w-4 text-red-500" />
        ) : bpSummary.trend === 'decreasing' ? (
          <TrendingDown className="h-4 w-4 text-emerald-500" />
        ) : (
          <Minus className="h-4 w-4 text-slate-400" />
        )}
      </div>

      <div className="mb-3">
        {bp ? (
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-800">
              {bp.systolic}
            </span>
            <span className="text-lg text-slate-400">/</span>
            <span className="text-lg font-semibold text-slate-600">
              {bp.diastolic}
            </span>
            <span className="text-xs text-slate-400 mr-1">mmHg</span>
          </div>
        ) : (
          <span className="text-2xl font-bold text-slate-400">—</span>
        )}
        <p className="text-xs text-slate-500 mt-0.5">قبل از دیالیز</p>
      </div>

      {bpSummary.last_during && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">حین دیالیز</span>
          <span className="text-xs font-medium text-slate-700">
            {bpSummary.last_during.systolic}/{bpSummary.last_during.diastolic}
          </span>
        </div>
      )}
    </motion.div>
  )
}