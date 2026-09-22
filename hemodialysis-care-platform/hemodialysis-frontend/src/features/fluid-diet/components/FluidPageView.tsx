'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Droplets, Plus, Minus } from 'lucide-react'
import { useUpsertFluidLog, useFluidHistory } from '../hooks/useFluidLog'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { todayISO, formatDate } from '@/lib/utils/date.utils'
import { pageVariants } from '@/lib/animation/variants'
import { PageHeader } from '@/components/layout/PageHeader'

interface FluidPageViewProps {
  patientId: string
}

const FLUID_PRESETS = [
  { label: 'آب', amount: 200 },
  { label: 'چای', amount: 150 },
  { label: 'شیر', amount: 200 },
  { label: 'آبمیوه', amount: 150 },
  { label: 'سوپ', amount: 250 },
  { label: 'دوغ', amount: 200 },
]

export function FluidPageView({ patientId }: FluidPageViewProps) {
  const [totalMl, setTotalMl] = useState(0)
  const [customAmount, setCustomAmount] = useState('')
  const [notes, setNotes] = useState('')

  const { mutateAsync, isPending } = useUpsertFluidLog(patientId)
  const { data: history, isLoading } = useFluidHistory(patientId, { size: 7 })

  const addAmount = (ml: number) => {
    setTotalMl((prev) => Math.min(prev + ml, 5000))
  }

  const handleSubmit = async () => {
    if (totalMl <= 0) return
    await mutateAsync({
      log_date: todayISO(),
      total_ml: totalMl,
      notes: notes.trim() || undefined,
    })
    setTotalMl(0)
    setNotes('')
    setCustomAmount('')
  }

  const percentage = Math.min((totalMl / 1500) * 100, 100)
  const overLimit = totalMl > 1500

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      <PageHeader
        title="پایش مایعات"
        description="مصرف روزانه مایعات خود را ثبت کنید"
      />

      {/* Today tracker */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Droplets className={`h-5 w-5 ${overLimit ? 'text-red-500' : 'text-primary-500'}`} />
            <span className="text-sm font-semibold text-slate-800">
              امروز
            </span>
          </div>
          <div className="text-left">
            <span className={`text-2xl font-bold ${overLimit ? 'text-red-600' : 'text-primary-600'}`}>
              {totalMl}
            </span>
            <span className="text-sm text-slate-400 mr-1">ml</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.4 }}
            className={`h-full rounded-full ${overLimit ? 'bg-red-500' : 'bg-primary-500'}`}
          />
        </div>
        <p className="text-[11px] text-slate-400 text-left">
          {overLimit ? '⚠️ بیش از حد توصیه‌شده' : `${totalMl} از ۱۵۰۰ ml`}
        </p>

        {/* Quick add presets */}
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-500 mb-2">
            اضافه کردن سریع:
          </p>
          <div className="grid grid-cols-3 gap-2">
            {FLUID_PRESETS.map(({ label, amount }) => (
              <button
                key={label}
                type="button"
                onClick={() => addAmount(amount)}
                className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-2 hover:border-primary-200 hover:bg-primary-50 transition-colors"
              >
                <span className="text-xs font-medium text-slate-700">
                  {label}
                </span>
                <span className="text-[10px] text-slate-400">{amount} ml</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom amount */}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="مقدار دلخواه (ml)"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          <button
            type="button"
            onClick={() => {
              const val = parseInt(customAmount)
              if (val > 0) {
                addAmount(val)
                setCustomAmount('')
              }
            }}
            className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setTotalMl(0)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-slate-500 hover:bg-slate-50"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        {/* Notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={1}
          placeholder="یادداشت (اختیاری)..."
          className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none"
        />

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || totalMl <= 0}
          className="mt-3 w-full rounded-xl bg-primary-500 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50"
        >
          {isPending ? 'در حال ثبت...' : 'ثبت مصرف امروز'}
        </button>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">
          ۷ روز اخیر
        </h3>

        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && (history?.data?.length ?? 0) === 0 && (
          <EmptyState
            title="تاریخچه‌ای ثبت نشده"
            size="sm"
          />
        )}

        {!isLoading && (history?.data?.length ?? 0) > 0 && (
          <div className="space-y-2">
            {history!.data.map((log) => {
              const pct = Math.min((log.total_ml / 1500) * 100, 100)
              const over = log.total_ml > 1500
              return (
                <div
                  key={log.id}
                  className="flex items-center gap-3"
                >
                  <span className="w-20 shrink-0 text-xs text-slate-500">
                    {formatDate(log.log_date)}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full ${over ? 'bg-red-400' : 'bg-primary-400'}`}
                    />
                  </div>
                  <span className={`w-16 text-right text-xs font-medium ${over ? 'text-red-600' : 'text-slate-700'}`}>
                    {log.total_ml} ml
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}