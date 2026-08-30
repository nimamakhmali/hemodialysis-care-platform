// src/features/lab-results/components/LabRangeIndicator.tsx
'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils/cn'

interface Props {
  value: number
  normalLow: number
  normalHigh: number
  criticalLow?: number | null
  criticalHigh?: number | null
  unit: string
}

export function LabRangeIndicator({ value, normalLow, normalHigh, criticalLow, criticalHigh, unit }: Props) {
  const min = criticalLow ?? normalLow * 0.6
  const max = criticalHigh ?? normalHigh * 1.4
  const range = max - min

  const toPercent = (v: number) => Math.max(0, Math.min(100, ((v - min) / range) * 100))

  const valuePercent = toPercent(value)
  const normalLowPct = toPercent(normalLow)
  const normalHighPct = toPercent(normalHigh)

  const isLow = value < normalLow
  const isHigh = value > normalHigh
  const isCriticalLow = criticalLow != null && value < criticalLow
  const isCriticalHigh = criticalHigh != null && value > criticalHigh

  const markerColor =
    isCriticalLow || isCriticalHigh ? '#EF4444' :
    isLow || isHigh ? '#F59E0B' :
    '#22C55E'

  return (
    <div className="w-full">
      {/* Bar */}
      <div className="relative h-2.5 rounded-full overflow-hidden bg-slate-100">
        {/* Critical zones */}
        {criticalLow && (
          <div className="absolute inset-y-0 left-0 bg-red-200/60 rounded-l-full" style={{ width: `${toPercent(criticalLow)}%` }} />
        )}
        {criticalHigh && (
          <div className="absolute inset-y-0 right-0 bg-red-200/60 rounded-r-full" style={{ width: `${100 - toPercent(criticalHigh)}%` }} />
        )}
        {/* Normal zone */}
        <div
          className="absolute inset-y-0 bg-emerald-200/70"
          style={{ left: `${normalLowPct}%`, width: `${normalHighPct - normalLowPct}%` }}
        />
        {/* Value marker */}
        <motion.div
          initial={{ left: '0%' }}
          animate={{ left: `${valuePercent}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md z-10"
          style={{ background: markerColor, boxShadow: `0 0 8px ${markerColor}60` }}
        />
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between mt-1.5 text-xs text-slate-400">
        {criticalLow && <span>{criticalLow}</span>}
        <span className="text-slate-500">{normalLow} – {normalHigh} {unit}</span>
        {criticalHigh && <span>{criticalHigh}</span>}
      </div>
    </div>
  )
}