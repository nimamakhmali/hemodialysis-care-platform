// src/features/lab-results/components/LabResultCard.tsx
'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'motion/react'
import { TrendingUp, TrendingDown, Minus, ChevronDown } from 'lucide-react'
import { LAB_NAMES_FA, LAB_UNITS } from '@/config/constants'
import { getLabStatus } from '@/lib/utils/medical.utils'
import { LabStatusBadge } from './LabStatusBadge'
import { LabRangeIndicator } from './LabRangeIndicator'
import { cn } from '@/lib/utils/cn'
import type { LabResult, ReferenceRange } from '../types/lab.types'
import type { LabTestCode } from '@/types/common.types'

interface Props {
  result: LabResult
  refRange?: ReferenceRange
  delay?: number
  showRange?: boolean
}

const TREND_ICON = {
  increasing: TrendingUp,
  decreasing: TrendingDown,
  stable: Minus,
}

export function LabResultCard({ result, refRange, delay = 0, showRange = true }: Props) {
  const [expanded, setExpanded] = useState(false)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  const status = refRange
    ? getLabStatus(result.value, refRange.normal_low, refRange.normal_high, refRange.critical_low ?? undefined, refRange.critical_high ?? undefined)
    : result.is_critical ? 'critical' : result.is_abnormal ? 'warning' : 'ok'

  const statusColors = {
    ok:       { bg: 'bg-emerald-50',  border: 'border-emerald-100', value: 'text-emerald-700', glow: '0 0 20px rgba(34,197,94,0.15)' },
    warning:  { bg: 'bg-amber-50',    border: 'border-amber-100',   value: 'text-amber-700',   glow: '0 0 20px rgba(245,158,11,0.15)' },
    critical: { bg: 'bg-red-50',      border: 'border-red-100',     value: 'text-red-700',     glow: '0 0 20px rgba(239,68,68,0.2)'  },
    neutral:  { bg: 'bg-slate-50',    border: 'border-slate-100',   value: 'text-slate-700',   glow: 'none' },
    unknown:  { bg: 'bg-slate-50',    border: 'border-slate-100',   value: 'text-slate-700',   glow: 'none' },
  }[status]

  const nameFa = LAB_NAMES_FA[result.test_code as LabTestCode] ?? result.test_code
  const unit = (result.unit || LAB_UNITS[result.test_code as LabTestCode]) ?? ''

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        'rounded-2xl border p-4 transition-all duration-300 cursor-pointer',
        statusColors.bg, statusColors.border
      )}
      style={{ boxShadow: statusColors.glow }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Top */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">{result.test_code}</p>
          <p className="font-semibold text-slate-800 text-sm">{nameFa}</p>
        </div>
        <div className="flex items-center gap-2">
          <LabStatusBadge status={status} direction={result.abnormality_direction} />
          {showRange && refRange && (
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-1.5 mb-3">
        <motion.span
          key={result.value}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('text-3xl font-black', statusColors.value)}
        >
          {result.value}
        </motion.span>
        <span className="text-sm text-slate-500 mb-1">{unit}</span>
      </div>

      {/* Ref range inline */}
      {refRange && (
        <p className="text-xs text-slate-400 mb-3">
          مرجع: {refRange.normal_low} – {refRange.normal_high} {unit}
        </p>
      )}

      {/* Expanded range bar */}
      <AnimatePresence>
        {expanded && refRange && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-2 border-t border-current/10">
              <LabRangeIndicator
                value={result.value}
                normalLow={refRange.normal_low}
                normalHigh={refRange.normal_high}
                criticalLow={refRange.critical_low}
                criticalHigh={refRange.critical_high}
                unit={unit}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}