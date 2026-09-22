'use client'

import { motion } from 'motion/react'
import { ShieldAlert } from 'lucide-react'
import type { AlertSeverity } from '@/types/common.types'

interface RiskScoreCardProps {
  score: number
  level: AlertSeverity
  interpretationFa: string
  contributingFactors?: Array<{
    factor: string
    contribution: number
    detail: string
  }>
}

const LEVEL_CONFIG: Record<AlertSeverity, {
  label: string; bg: string; text: string; bar: string; border: string
}> = {
  low: {
    label: 'ریسک پایین', bg: 'bg-emerald-50', text: 'text-emerald-700',
    bar: 'bg-emerald-500', border: 'border-emerald-200',
  },
  medium: {
    label: 'ریسک متوسط', bg: 'bg-amber-50', text: 'text-amber-700',
    bar: 'bg-amber-500', border: 'border-amber-200',
  },
  high: {
    label: 'ریسک بالا', bg: 'bg-red-50', text: 'text-red-700',
    bar: 'bg-red-500', border: 'border-red-200',
  },
}

export function RiskScoreCard({
  score,
  level,
  interpretationFa,
  contributingFactors,
}: RiskScoreCardProps) {
  const config = LEVEL_CONFIG[level]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`rounded-2xl border p-5 ${config.bg} ${config.border}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className={`h-5 w-5 ${config.text}`} />
        <span className={`text-sm font-semibold ${config.text}`}>
          {config.label}
        </span>
      </div>

      {/* Score bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500">امتیاز ریسک</span>
          <span className={`text-sm font-bold ${config.text}`}>{score}/100</span>
        </div>
        <div className="h-2 rounded-full bg-white/60 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${config.bar}`}
          />
        </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">{interpretationFa}</p>

      {contributingFactors && contributingFactors.length > 0 && (
        <div className="mt-3 space-y-1">
          {contributingFactors.slice(0, 3).map((f) => (
            <div key={f.factor} className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">{f.detail}</span>
              <span className={`text-[11px] font-medium ${config.text}`}>
                +{f.contribution}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}