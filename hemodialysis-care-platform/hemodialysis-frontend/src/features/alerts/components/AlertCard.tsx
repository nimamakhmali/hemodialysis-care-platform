'use client'

import { motion } from 'motion/react'
import { AlertTriangle, AlertCircle, Info, CheckCheck, X } from 'lucide-react'
import type { Alert } from '../types/alert.types'
import { formatDistanceToNow } from '@/lib/utils/date.utils'

interface AlertCardProps {
  alert: Alert
  onAcknowledge?: (id: string) => void
  onResolve?: (id: string) => void
  compact?: boolean
}

const SEVERITY_CONFIG = {
  high: {
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-700',
    label: 'بحرانی',
    dot: 'bg-red-500',
  },
  medium: {
    icon: AlertCircle,
    iconColor: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    label: 'متوسط',
    dot: 'bg-amber-500',
  },
  low: {
    icon: Info,
    iconColor: 'text-sky-600',
    bg: 'bg-sky-50 border-sky-200',
    badge: 'bg-sky-100 text-sky-700',
    label: 'کم',
    dot: 'bg-sky-400',
  },
}

const STATUS_LABEL = {
  new: 'جدید',
  acknowledged: 'بررسی‌شده',
  resolved: 'بسته‌شده',
}

export function AlertCard({
  alert,
  onAcknowledge,
  onResolve,
  compact = false,
}: AlertCardProps) {
  const config = SEVERITY_CONFIG[alert.severity]
  const isResolved = alert.status === 'resolved'

  return (
    <div
      className={`
        rounded-2xl border p-5 transition-all duration-200
        ${isResolved ? 'opacity-60' : ''}
        ${config.bg}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/70">
          <config.icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.badge}`}
              >
                {config.label}
              </span>
              <span className="text-xs text-slate-500">
                {STATUS_LABEL[alert.status]}
              </span>
              {alert.patient_name && (
                <span className="text-xs font-medium text-slate-700">
                  {alert.patient_name}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 whitespace-nowrap">
              {formatDistanceToNow(alert.created_at)}
            </span>
          </div>

          <p className="text-sm font-medium text-slate-800 mb-1">
            {alert.title}
          </p>

          {!compact && (
            <p className="text-xs text-slate-600 leading-relaxed">
              {alert.clinician_explanation}
            </p>
          )}

          {/* Actions */}
          {!isResolved && (onAcknowledge || onResolve) && (
            <div className="flex items-center gap-2 mt-3">
              {alert.status === 'new' && onAcknowledge && (
                <button
                  onClick={() => onAcknowledge(alert.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-white/80 border border-current/20 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  دیدم
                </button>
              )}
              {onResolve && (
                <button
                  onClick={() => onResolve(alert.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-white/80 border border-current/20 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  بستن
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}