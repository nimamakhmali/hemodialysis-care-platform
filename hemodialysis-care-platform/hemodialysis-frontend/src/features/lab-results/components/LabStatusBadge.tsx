// src/features/lab-results/components/LabStatusBadge.tsx
'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils/cn'
import type { HealthStatus } from '@/types/common.types'

interface Props {
  status: HealthStatus
  direction?: 'high' | 'low' | null
  size?: 'sm' | 'md'
}

const CONFIG: Record<HealthStatus, { label: string; className: string; dot: string }> = {
  ok:      { label: 'طبیعی',  className: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  warning: { label: 'هشدار',  className: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500'   },
  critical:{ label: 'بحرانی', className: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500'     },
  neutral: { label: 'نامشخص', className: 'bg-slate-50 text-slate-600 border-slate-200',       dot: 'bg-slate-400'   },
  unknown: { label: 'نامشخص', className: 'bg-slate-50 text-slate-600 border-slate-200',       dot: 'bg-slate-400'   },
}

const ARROW = { high: '↑', low: '↓' }

export function LabStatusBadge({ status, direction, size = 'sm' }: Props) {
  const cfg = CONFIG[status]
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        cfg.className
      )}
    >
      <span className={cn('rounded-full flex-shrink-0', cfg.dot, size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')} />
      {cfg.label}
      {direction && <span className="font-bold">{ARROW[direction]}</span>}
    </motion.span>
  )
}