'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Bell, Filter } from 'lucide-react'
import { useAllAlerts, useAcknowledgeAlert, useResolveAlert } from '../hooks/useAlerts'
import { AlertCard } from './AlertCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import type { AlertStatus, AlertSeverity } from '@/types/common.types'

export function AlertFeed() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<AlertStatus | undefined>('new')
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | undefined>()

  const { data, isLoading, isError } = useAllAlerts({
    page,
    size: 15,
    status: statusFilter,
    severity: severityFilter,
  })

  const { mutate: acknowledge } = useAcknowledgeAlert()
  const { mutate: resolve } = useResolveAlert()

  const alerts = data?.data ?? []

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {([
            { label: 'جدید', value: 'new' },
            { label: 'همه', value: undefined },
            { label: 'بسته‌شده', value: 'resolved' },
          ] as { label: string; value: AlertStatus | undefined }[]).map((f) => (
            <button
              key={String(f.value)}
              onClick={() => { setStatusFilter(f.value); setPage(1) }}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-[#0EA5E9] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {([
            { label: 'همه شدت', value: undefined },
            { label: 'بحرانی', value: 'high' },
            { label: 'متوسط', value: 'medium' },
          ] as { label: string; value: AlertSeverity | undefined }[]).map((f) => (
            <button
              key={String(f.value)}
              onClick={() => { setSeverityFilter(f.value); setPage(1) }}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                severityFilter === f.value
                  ? 'bg-[#0EA5E9] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-center text-sm text-red-500 py-8">
          خطا در دریافت هشدارها
        </p>
      )}

      {!isLoading && !isError && alerts.length === 0 && (
        <EmptyState
          icon={<Bell />}
          title="هشداری وجود ندارد"
          description="هیچ هشداری با فیلتر انتخابی یافت نشد"
        />
      )}

      {!isLoading && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={
                alert.status === 'new'
                  ? (id) => acknowledge({ alertId: id })
                  : undefined
              }
              onResolve={
                alert.status !== 'resolved'
                  ? (id) => resolve({ alertId: id })
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.pages}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}