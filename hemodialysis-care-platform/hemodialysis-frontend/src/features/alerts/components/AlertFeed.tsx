'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, CheckCircle, X, RefreshCw, Filter } from 'lucide-react'
import { useAlerts, useAcknowledgeAlert, useResolveAlert } from '../hooks/useAlerts'
import { AlertCard } from './AlertCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import type { AlertSeverity, AlertStatus } from '@/types/common.types'

const SEVERITY_FILTER: { value: AlertSeverity | 'all'; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'high', label: 'بحرانی' },
  { value: 'medium', label: 'متوسط' },
  { value: 'low', label: 'کم' },
]

const STATUS_FILTER: { value: AlertStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'new', label: 'جدید' },
  { value: 'acknowledged', label: 'تأییدشده' },
  { value: 'resolved', label: 'بسته‌شده' },
]

export function AlertFeed() {
  const [severity, setSeverity] = useState<AlertSeverity | undefined>()
  const [status, setStatus] = useState<AlertStatus | undefined>()

  const { data, isLoading, isError, refetch } = useAlerts(
    severity || status
      ? { ...(severity && { severity }), ...(status && { status }) }
      : undefined
  )

  const { mutate: acknowledge } = useAcknowledgeAlert()
  const { mutate: resolve } = useResolveAlert()

  const alerts = data?.data ?? []

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Severity */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white p-1 shadow-sm">
          {SEVERITY_FILTER.map(({ value, label }) => (
            <button
              key={value}
              onClick={() =>
                setSeverity(value === 'all' ? undefined : (value as AlertSeverity))
              }
              className={`
                rounded-lg px-3 py-1.5 text-xs font-medium transition-all
                ${
                  (value === 'all' && !severity) || severity === value
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white p-1 shadow-sm">
          {STATUS_FILTER.map(({ value, label }) => (
            <button
              key={value}
              onClick={() =>
                setStatus(value === 'all' ? undefined : (value as AlertStatus))
              }
              className={`
                rounded-lg px-3 py-1.5 text-xs font-medium transition-all
                ${
                  (value === 'all' && !status) || status === value
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => refetch()}
          className="mr-auto flex items-center gap-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          بروزرسانی
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">خطا در دریافت هشدارها</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && alerts.length === 0 && (
        <EmptyState
          icon={<CheckCircle />}
          title="هشداری وجود ندارد"
          description="در حال حاضر هیچ هشدار فعالی ثبت نشده است"
        />
      )}

      {/* Alerts */}
      <AnimatePresence mode="popLayout">
        {alerts.map((alert, i) => (
          <motion.div
            key={alert.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: i * 0.04 }}
          >
            <AlertCard
              alert={alert}
              onAcknowledge={(id) => acknowledge({ alertId: id })}
              onResolve={(id) => resolve({ alertId: id })}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}