'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Trash2, Save, X, AlertCircle } from 'lucide-react'
import { useCreateLabPanel, useReferenceRanges } from '../hooks/useLabResults'
import {
  LAB_TEST_CODES,
  LAB_TEST_LABELS,
  LAB_TEST_UNITS,
} from '../types/lab.types'
import type { CreateLabResultItem } from '../types/lab.types'
import { todayISO } from '@/lib/utils/date.utils'

interface LabPanelFormProps {
  patientId: string
  onSuccess?: () => void
  onCancel?: () => void
}

interface FormResult extends CreateLabResultItem {
  _id: string
  error?: string
}

export function LabPanelForm({ patientId, onSuccess, onCancel }: LabPanelFormProps) {
  const { mutateAsync, isPending } = useCreateLabPanel(patientId)
  const { data: refRanges } = useReferenceRanges()

  const [collectedAt, setCollectedAt] = useState(todayISO())
  const [reportedAt, setReportedAt] = useState('')
  const [notes, setNotes] = useState('')
  const [results, setResults] = useState<FormResult[]>([
    createEmptyResult(),
  ])
  const [formError, setFormError] = useState('')

  function createEmptyResult(): FormResult {
    return {
      _id: crypto.randomUUID(),
      test_code: '',
      value: 0,
      unit: '',
    }
  }

  const addResult = () => {
    setResults((prev) => [...prev, createEmptyResult()])
  }

  const removeResult = (id: string) => {
    setResults((prev) => prev.filter((r) => r._id !== id))
  }

  const updateResult = useCallback(
    (id: string, field: keyof CreateLabResultItem, value: string | number) => {
      setResults((prev) =>
        prev.map((r) => {
          if (r._id !== id) return r
          const updated = { ...r, [field]: value, error: undefined }

          // اگر test_code تغییر کرد، unit را auto-fill کن
          if (field === 'test_code' && typeof value === 'string') {
            updated.unit = LAB_TEST_UNITS[value] ?? ''
          }

          return updated
        })
      )
    },
    []
  )

  const getValidRange = (code: string) => {
    if (!refRanges) return null
    return refRanges.find((r) => r.test_code === code) ?? null
  }

  const validate = (): boolean => {
    let valid = true
    setFormError('')

    if (!collectedAt) {
      setFormError('تاریخ نمونه‌گیری الزامی است')
      return false
    }

    const usedCodes = new Set<string>()
    const updatedResults = results.map((r) => {
      const err: string[] = []

      if (!r.test_code) err.push('آزمایش انتخاب نشده')
      else if (usedCodes.has(r.test_code)) err.push('این آزمایش تکراری است')
      else usedCodes.add(r.test_code)

      if (!r.value && r.value !== 0) err.push('مقدار الزامی است')
      else {
        const ref = getValidRange(r.test_code)
        if (ref && (r.value < ref.valid_min || r.value > ref.valid_max)) {
          err.push(`مقدار خارج از محدوده منطقی (${ref.valid_min}–${ref.valid_max})`)
        }
      }

      if (!r.unit) err.push('واحد الزامی است')

      if (err.length > 0) valid = false
      return { ...r, error: err.join(' — ') }
    })

    setResults(updatedResults)
    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    await mutateAsync({
      collected_at: collectedAt,
      reported_at: reportedAt || undefined,
      notes: notes || undefined,
      results: results.map(({ _id, error, ...r }) => r),
    })

    onSuccess?.()
  }

  const usedCodes = new Set(results.map((r) => r.test_code).filter(Boolean))

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {formError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{formError}</p>
        </div>
      )}

      {/* Dates */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          اطلاعات نمونه
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">
              تاریخ نمونه‌گیری *
            </label>
            <input
              type="date"
              value={collectedAt}
              onChange={(e) => setCollectedAt(e.target.value)}
              max={todayISO()}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">
              تاریخ جواب (اختیاری)
            </label>
            <input
              type="date"
              value={reportedAt}
              onChange={(e) => setReportedAt(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>
        <div className="mt-4 space-y-1">
          <label className="block text-xs font-medium text-slate-600">
            یادداشت (اختیاری)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="یادداشت اضافی..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm resize-none focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </div>

      {/* Results */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">نتایج آزمایش</h3>
          <button
            type="button"
            onClick={addResult}
            className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-100"
          >
            <Plus className="h-3.5 w-3.5" />
            افزودن آزمایش
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {results.map((result) => {
              const ref = getValidRange(result.test_code)
              return (
                <motion.div
                  key={result._id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div
                    className={`rounded-xl border p-3 ${
                      result.error
                        ? 'border-red-200 bg-red-50'
                        : 'border-slate-100 bg-slate-50/50'
                    }`}
                  >
                    <div className="grid grid-cols-12 gap-2 items-start">
                      {/* Test selector */}
                      <div className="col-span-5">
                        <select
                          value={result.test_code}
                          onChange={(e) =>
                            updateResult(result._id, 'test_code', e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs focus:border-primary-300 focus:outline-none"
                        >
                          <option value="">انتخاب آزمایش</option>
                          {LAB_TEST_CODES.map((code) => (
                            <option
                              key={code}
                              value={code}
                              disabled={usedCodes.has(code) && code !== result.test_code}
                            >
                              {LAB_TEST_LABELS[code] ?? code} ({code})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Value */}
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          value={result.value || ''}
                          onChange={(e) =>
                            updateResult(result._id, 'value', Number(e.target.value))
                          }
                          placeholder="مقدار"
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs focus:border-primary-300 focus:outline-none"
                        />
                      </div>

                      {/* Unit */}
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={result.unit}
                          onChange={(e) =>
                            updateResult(result._id, 'unit', e.target.value)
                          }
                          placeholder="واحد"
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs focus:border-primary-300 focus:outline-none"
                        />
                      </div>

                      {/* Delete */}
                      <div className="col-span-1 flex justify-center">
                        {results.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeResult(result._id)}
                            className="mt-1 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reference range hint */}
                    {ref && (
                      <p className="mt-1.5 text-[10px] text-slate-400">
                        محدوده نرمال: {ref.normal_low}–{ref.normal_high} {ref.unit}
                      </p>
                    )}

                    {/* Error */}
                    {result.error && (
                      <p className="mt-1 text-[11px] text-red-600">
                        ⚠️ {result.error}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            انصراف
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isPending ? 'در حال ذخیره...' : 'ثبت آزمایش‌ها'}
        </button>
      </div>
    </form>
  )
}