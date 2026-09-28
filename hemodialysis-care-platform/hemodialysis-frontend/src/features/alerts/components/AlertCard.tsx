'use client'

import { motion } from 'motion/react'
import { AlertTriangle, Bell, Info, CheckCircle2, Eye, X } from 'lucide-react'
import type { AlertItem } from '@/types/api.types'
import type { AlertSeverity } from '@/types/common.types'
import {
  ALERT_SEVERITY_FA,
  ALERT_CATEGORY_FA,
  ALERT_STATUS_FA,
} from '@/types/common.types'
import { formatDateTime } from '@/lib/utils/date.utils'
import { cn } from '@/lib/utils/cn'

interface AlertCardProps {
  alert: AlertItem
  onAcknowledge?: (id: string) => void
  onResolve?: (id: string) => void
  compact?: boolean
}

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { icon: typeof AlertTriangle; bg: string; text: string; border: string; dot: string }
> = {
  high: {
    icon: AlertTriangle,
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  medium: {
    icon: Bell,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  low: {
    icon: Info,
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-400',
  },
}

export function AlertCard({
  alert,
  onAcknowledge,
  onResolve,
  compact = false,
}: AlertCardProps) {
  const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.medium
  const Icon = cfg.icon
  const isNew = alert.status === 'new'
  const isResolved = alert.status === 'resolved'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border p-4 shadow-sm',
        cfg.bg,
        cfg.border,
        isResolved && 'opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70'
          )}
        >
          <Icon className={cn('h-4 w-4', cfg.text)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold',
                  cfg.text,
                  'bg-white/60'
                )}
              >
                {ALERT_SEVERITY_FA[alert.severity]}
              </span>
              <span className="text-[10px] text-slate-500">
                {ALERT_CATEGORY_FA[alert.category]}
              </span>
              {isNew && (
                <span className="flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                  جدید
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 shrink-0">
              {formatDateTime(alert.created_at)}
            </span>
          </div>

          <p className={cn('text-sm font-semibold mt-1', cfg.text)}>
            {alert.title}
          </p>

          {!compact && (
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              {alert.clinician_explanation}
            </p>
          )}

          {/* Evidence */}
          {!compact && alert.evidence &&
            Object.keys(alert.evidence).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(alert.evidence)
                  .slice(0, 4)
                  .map(([k, v]) => (
                    <span
                      key={k}
                      className="rounded-md bg-white/60 px-2 py-0.5 text-[10px] text-slate-600"
                    >
                      {k}: {String(v)}
                    </span>
                  ))}
              </div>
            )}

          {alert.patient_name && (
            <p className="text-[11px] text-slate-500 mt-1">
              بیمار: {alert.patient_name}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {(onAcknowledge || onResolve) && !isResolved && (
        <div className="mt-3 flex items-center gap-2 justify-end">
          {onAcknowledge && isNew && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="flex items-center gap-1.5 rounded-lg bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              دیدم
            </button>
          )}
          {onResolve && (
            <button
              onClick={() => onResolve(alert.id)}
              className="flex items-center gap-1.5 rounded-lg bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              بستن
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}