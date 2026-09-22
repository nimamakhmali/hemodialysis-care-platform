'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Utensils, Save } from 'lucide-react'
import { useUpsertDietLog, useDietHistory } from '../hooks/useDietLog'
import {
  DIET_ADHERENCE_LABELS,
  DIET_ADHERENCE_COLORS,
  DIET_CATEGORY_LABELS,
} from '../types/fluid-diet.types'
import type { DietAdherence } from '@/types/common.types'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { todayISO, formatDate } from '@/lib/utils/date.utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { pageVariants } from '@/lib/animation/variants'

interface DietPageViewProps {
  patientId: string
}

type DietFields = {
  potassium_adherence: DietAdherence
  phosphorus_adherence: DietAdherence
  protein_adherence: DietAdherence
  sodium_adherence: DietAdherence
}

const DEFAULT_DIET: DietFields = {
  potassium_adherence: 'good',
  phosphorus_adherence: 'good',
  protein_adherence: 'good',
  sodium_adherence: 'good',
}

const ADHERENCE_VALUES: DietAdherence[] = ['good', 'moderate', 'poor']

export function DietPageView({ patientId }: DietPageViewProps) {
  const [form, setForm] = useState<DietFields>(DEFAULT_DIET)
  const [notes, setNotes] = useState('')

  const { mutateAsync, isPending } = useUpsertDietLog(patientId)
  const { data: history, isLoading } = useDietHistory(patientId, { size: 7 })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await mutateAsync({
      log_date: todayISO(),
      ...form,
      notes: notes.trim() || undefined,
    })
    setForm(DEFAULT_DIET)
    setNotes('')
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      <PageHeader
        title="رژیم غذایی"
        description="رعایت رژیم درمانی امروز را ثبت کنید"
      />

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Utensils className="h-4 w-4 text-primary-500" />
          <h3 className="text-sm font-semibold text-slate-800">ثبت امروز</h3>
        </div>

        {(Object.keys(DIET_CATEGORY_LABELS) as (keyof typeof DIET_CATEGORY_LABELS)[]).map(
          (field) => (
            <div key={field}>
              <p className="text-xs font-medium text-slate-600 mb-2">
                محدودیت {DIET_CATEGORY_LABELS[field]}
              </p>
              <div className="flex gap-2">
                {ADHERENCE_VALUES.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, [field]: val }))
                    }
                    className={`
                      flex-1 rounded-xl border py-2.5 text-xs font-medium transition-all
                      ${
                        form[field] === val
                          ? DIET_ADHERENCE_COLORS[val]
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                      }
                    `}
                  >
                    {DIET_ADHERENCE_LABELS[val]}
                  </button>
                ))}
              </div>
            </div>
          )
        )}

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="یادداشت (اختیاری)..."
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:outline-none"
        />

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? 'در حال ثبت...' : 'ثبت رژیم امروز'}
        </button>
      </form>

      {/* History */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">
          ۷ روز اخیر
        </h3>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && (history?.data?.length ?? 0) === 0 && (
          <EmptyState title="تاریخچه‌ای ثبت نشده" size="sm" />
        )}

        {!isLoading &&
          history?.data.map((log) => (
            <div
              key={log.id}
              className="mb-3 last:mb-0 rounded-xl border border-slate-100 p-3"
            >
              <p className="text-xs text-slate-500 mb-2">
                {formatDate(log.log_date)}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  Object.keys(DIET_CATEGORY_LABELS) as (keyof typeof DIET_CATEGORY_LABELS)[]
                ).map((field) => (
                  <div key={field} className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {DIET_CATEGORY_LABELS[field]}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${DIET_ADHERENCE_COLORS[log[field]]}`}
                    >
                      {DIET_ADHERENCE_LABELS[log[field]]}
                    </span>
                  </div>
                ))}
              </div>
              {log.notes && (
                <p className="mt-1.5 text-[11px] text-slate-400">{log.notes}</p>
              )}
            </div>
          ))}
      </div>
    </motion.div>
  )
}