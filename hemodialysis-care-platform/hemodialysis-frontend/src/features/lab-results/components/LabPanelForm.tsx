// src/features/lab-results/components/LabPanelForm.tsx
'use client'

import { useState, useCallback } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Minus, FlaskConical, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LAB_NAMES_FA, LAB_UNITS } from '@/config/constants'
import { getLabStatus } from '@/lib/utils/medical.utils'
import { cn } from '@/lib/utils/cn'
import type { LabTestCode } from '@/types/common.types'
import type { ReferenceRange, CreateLabPanelForm } from '../types/lab.types'

// ---- Schema ----
const panelSchema = z.object({
  collected_at: z.string().min(1, 'تاریخ نمونه‌گیری الزامی است'),
  reported_at: z.string().optional(),
  notes: z.string().max(500).optional(),
  results: z.array(z.object({
    test_code: z.string(),
    value: z.number({ invalid_type_error: 'مقدار عددی وارد کنید' }).min(0, 'مقدار نامعتبر'),
    unit: z.string(),
    enabled: z.boolean(),
  })).refine(
    (arr) => arr.some((r) => r.enabled),
    { message: 'حداقل یک آزمایش باید وارد شود' }
  ),
})

type FormValues = z.infer<typeof panelSchema>

// ---- Lab groups ----
const LAB_GROUPS = [
  { label: 'الکترولیت‌ها', codes: ['K', 'Na', 'Ca', 'P'] as LabTestCode[] },
  { label: 'خون',           codes: ['Hb', 'Hct']          as LabTestCode[] },
  { label: 'تغذیه و التهاب', codes: ['Alb', 'CRP']        as LabTestCode[] },
  { label: 'آهن',           codes: ['Ferritin', 'TSAT']   as LabTestCode[] },
  { label: 'متابولیک',      codes: ['PTH', 'Urea', 'Cr']  as LabTestCode[] },
]

const ALL_CODES = LAB_GROUPS.flatMap((g) => g.codes)

interface Props {
  refRanges?: ReferenceRange[]
  onSubmit: (data: CreateLabPanelForm) => Promise<void>
  isLoading?: boolean
  onCancel?: () => void
}

// ---- Single lab input row ----
function LabInputRow({
  code, unit, refRange, value, enabled,
  onToggle, onChange, error,
}: {
  code: LabTestCode
  unit: string
  refRange?: ReferenceRange
  value?: number
  enabled: boolean
  onToggle: () => void
  onChange: (v: number) => void
  error?: string
}) {
  const nameFa = LAB_NAMES_FA[code] ?? code

  const status = refRange && value != null
    ? getLabStatus(value, refRange.normal_low, refRange.normal_high, refRange.critical_low ?? undefined, refRange.critical_high ?? undefined)
    : null

  const statusIcon = status === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
    : status === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
    : status === 'critical' ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
    : null

  const inputBg = !enabled ? 'bg-slate-50 opacity-50' :
    status === 'critical' ? 'bg-red-50/50 border-red-200' :
    status === 'warning' ? 'bg-amber-50/50 border-amber-200' :
    status === 'ok' ? 'bg-emerald-50/30 border-emerald-200' :
    'bg-white border-primary-100'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('rounded-xl border p-3 transition-all duration-200', inputBg)}
    >
      <div className="flex items-center gap-3">
        {/* Toggle */}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
            enabled
              ? 'bg-primary-500 border-primary-500'
              : 'border-slate-300 bg-white'
          )}
        >
          {enabled && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
        </button>

        {/* Code + Name */}
        <div className="w-24 flex-shrink-0">
          <p className="text-xs font-bold text-slate-700">{code}</p>
          <p className="text-xs text-slate-400">{nameFa}</p>
        </div>

        {/* Input */}
        <div className="flex-1 relative">
          <input
            type="number"
            step="0.01"
            disabled={!enabled}
            value={value ?? ''}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            placeholder={refRange ? `${refRange.normal_low}–${refRange.normal_high}` : '—'}
            className={cn(
              'w-full rounded-lg border px-3 py-1.5 text-sm text-right font-medium',
              'focus:outline-none focus:ring-2 focus:ring-primary-200',
              'disabled:cursor-not-allowed',
              enabled ? 'border-transparent bg-white/80' : 'border-transparent bg-transparent',
            )}
          />
          {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        </div>

        {/* Unit + Status */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-slate-400">{unit}</span>
          <AnimatePresence>
            {statusIcon && (
              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                {statusIcon}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Ref range */}
      {enabled && refRange && (
        <p className="text-xs text-slate-400 mt-1.5 mr-8">
          مرجع: {refRange.normal_low} – {refRange.normal_high} {unit}
          {refRange.critical_high && ` | بحرانی بالا: >${refRange.critical_high}`}
        </p>
      )}
    </motion.div>
  )
}

// ---- Main Form ----
export function LabPanelForm({ refRanges = [], onSubmit, isLoading, onCancel }: Props) {
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set([0, 1]))
  const refMap = Object.fromEntries(refRanges.map((r) => [r.test_code, r]))

  const defaultResults = ALL_CODES.map((code) => ({
    test_code: code,
    value: 0,
    unit: LAB_UNITS[code] ?? '',
    enabled: false,
  }))

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(panelSchema),
    defaultValues: {
      collected_at: new Date().toISOString().split('T')[0],
      results: defaultResults,
    },
  })

  const { fields } = useFieldArray({ control, name: 'results' })
  const watchedResults = watch('results')

  const toggleGroup = (gi: number) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      next.has(gi) ? next.delete(gi) : next.add(gi)
      return next
    })
  }

  const getFieldIndex = useCallback((code: string) => ALL_CODES.indexOf(code as LabTestCode), [])

  const handleFormSubmit = async (values: FormValues) => {
    const payload: CreateLabPanelForm = {
      collected_at: values.collected_at,
      reported_at: values.reported_at,
      notes: values.notes,
      results: values.results
        .filter((r) => r.enabled && !isNaN(r.value))
        .map((r) => ({ test_code: r.test_code as LabTestCode, value: r.value, unit: r.unit })),
    }
    await onSubmit(payload)
  }

  const enabledCount = watchedResults.filter((r) => r.enabled).length

  return (
    <div className="bg-white rounded-2xl border border-primary-100 overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(14,165,233,0.07)' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-l from-primary-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">ثبت پنل آزمایشگاهی</h3>
            <p className="text-xs text-slate-400">
              {enabledCount > 0 ? `${enabledCount} آزمایش انتخاب شده` : 'آزمایش‌ها را انتخاب و مقدار وارد کنید'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="p-6 space-y-5">
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">تاریخ نمونه‌گیری *</label>
              <Input type="date" {...register('collected_at')} error={errors.collected_at?.message} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">تاریخ جواب (اختیاری)</label>
              <Input type="date" {...register('reported_at')} />
            </div>
          </div>

          {/* Lab Groups */}
          <div className="space-y-3">
            {LAB_GROUPS.map((group, gi) => {
              const isOpen = openGroups.has(gi)
              const groupEnabledCount = group.codes.filter((code) => {
                const idx = getFieldIndex(code)
                return watchedResults[idx]?.enabled
              }).length

              return (
                <div key={group.label} className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* Group Header */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(gi)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">{group.label}</span>
                      {groupEnabledCount > 0 && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                          {groupEnabledCount} انتخاب شده
                        </span>
                      )}
                    </div>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </motion.div>
                  </button>

                  {/* Group Content */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 space-y-2">
                          {group.codes.map((code) => {
                            const idx = getFieldIndex(code)
                            const field = watchedResults[idx]
                            if (!field) return null
                            return (
                              <LabInputRow
                                key={code}
                                code={code}
                                unit={LAB_UNITS[code] ?? ''}
                                refRange={refMap[code]}
                                value={isNaN(field.value) ? undefined : field.value}
                                enabled={field.enabled}
                                onToggle={() => setValue(`results.${idx}.enabled`, !field.enabled)}
                                onChange={(v) => setValue(`results.${idx}.value`, v)}
                                error={(errors.results as any)?.[idx]?.value?.message}
                              />
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">یادداشت (اختیاری)</label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full rounded-xl border border-primary-100 px-4 py-3 text-sm text-right font-vazir resize-none focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="یادداشت کلینیکی..."
            />
          </div>

          {/* Error */}
          {errors.results?.root && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2 border border-red-200">
              {errors.results.root.message}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs text-slate-400">
            {enabledCount} آزمایش آماده ثبت
          </div>
          <div className="flex items-center gap-3">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>انصراف</Button>
            )}
            <Button type="submit" isLoading={isLoading} disabled={enabledCount === 0}>
              ثبت آزمایش‌ها
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}