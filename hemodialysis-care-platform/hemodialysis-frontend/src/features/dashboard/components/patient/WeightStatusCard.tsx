'use client'

import { motion } from 'motion/react'
import { Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { PatientDashboard } from '@/types/api.types'
import type { HealthStatus } from '@/types/common.types'

interface WeightStatusCardProps {
  weightSummary: PatientDashboard['weight_summary']
}

const STATUS_CONFIG: Record<HealthStatus, {
  label: string
  bg: string
  text: string
  border: string
}> = {
  ok: { label: 'مناسب', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  warning: { label: 'هشدار', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  critical: { label: 'بحرانی', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  neutral: { label: 'عادی', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  unknown: { label: 'نامشخص', bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-200' },
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'increasing') return <TrendingUp className="h-4 w-4 text-red-500" />
  if (trend === 'decreasing') return <TrendingDown className="h-4 w-4 text-emerald-500" />
  return <Minus className="h-4 w-4 text-slate-400" />
}

export function WeightStatusCard({ weightSummary }: WeightStatusCardProps) {
  const status = STATUS_CONFIG[weightSummary.status] ?? STATUS_CONFIG.unknown

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 ${status.bg} ${status.border}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70">
            <Scale className={`h-5 w-5 ${status.text}`} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">وزن</p>
            <span className={`text-xs font-semibold ${status.text}`}>
              {status.label}
            </span>
          </div>
        </div>
        <TrendIcon trend={weightSummary.trend} />
      </div>

      {/* Main value */}
      <div className="mb-3">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-800">
            {weightSummary.last_pre_weight?.toFixed(1) ?? '—'}
          </span>
          <span className="text-sm text-slate-400">kg</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          وزن در آخرین جلسه
        </p>
      </div>

      {/* Details */}
      <div className="space-y-1.5">
        <DetailRow
          label="وزن خشک"
          value={`${weightSummary.dry_weight?.toFixed(1)} kg`}
        />
        {weightSummary.weight_gain != null && (
          <DetailRow
            label="افزایش وزن"
            value={`${weightSummary.weight_gain.toFixed(1)} kg`}
            highlight={weightSummary.weight_gain > 3}
          />
        )}
        {weightSummary.idwg_percent != null && (
          <DetailRow
            label="IDWG"
            value={`${weightSummary.idwg_percent.toFixed(1)}%`}
            highlight={weightSummary.idwg_percent > 3}
          />
        )}
      </div>
    </motion.div>
  )
}

function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs font-medium ${highlight ? 'text-amber-600' : 'text-slate-700'}`}>
        {value}
      </span>
    </div>
  )
}