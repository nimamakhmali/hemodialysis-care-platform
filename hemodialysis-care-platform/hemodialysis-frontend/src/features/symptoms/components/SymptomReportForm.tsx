'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, Send } from 'lucide-react'
import { useCreateSymptomReport } from '../hooks/useSymptoms'
import {
  SYMPTOM_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  DANGER_SYMPTOMS,
} from '../types/symptom.types'
import type { SymptomType, SymptomSeverity, SymptomEntry } from '../types/symptom.types'

const ALL_SYMPTOMS = Object.keys(SYMPTOM_LABELS) as SymptomType[]

interface SymptomReportFormProps {
  patientId: string
  onSuccess?: () => void
  inline?: boolean
}

export function SymptomReportForm({
  patientId,
  onSuccess,
  inline = false,
}: SymptomReportFormProps) {
  const { mutateAsync, isPending } = useCreateSymptomReport(patientId)

  const [selected, setSelected] = useState<Map<SymptomType, SymptomSeverity>>(
    new Map()
  )
  const [notes, setNotes] = useState('')

  const toggleSymptom = (type: SymptomType) => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.set(type, 'mild')
      }
      return next
    })
  }

  const setSeverity = (type: SymptomType, severity: SymptomSeverity) => {
    setSelected((prev) => {
      const next = new Map(prev)
      next.set(type, severity)
      return next
    })
  }

  const hasDangerSymptom = Array.from(selected.keys()).some((t) =>
    DANGER_SYMPTOMS.has(t)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selected.size === 0) return

    const symptoms: SymptomEntry[] = Array.from(selected.entries()).map(
      ([type, severity]) => ({ type, severity })
    )

    await mutateAsync({
      symptoms,
      notes: notes.trim() || undefined,
    })

    setSelected(new Map())
    setNotes('')
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Danger warning */}
      <AnimatePresence>
        {hasDangerSymptom && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">
                علائم نیازمند توجه فوری
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                در صورت شدت بیشتر یا بدتر شدن، سریعاً با مرکز درمانی تماس بگیرید
                یا به اورژانس مراجعه کنید.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Symptom grid */}
      <div className={`rounded-2xl border border-slate-100 bg-white ${inline ? 'p-4' : 'p-5'} shadow-sm`}>
        <p className="text-xs font-medium text-slate-500 mb-3">
          علائمی که دارید را انتخاب کنید:
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_SYMPTOMS.map((type) => {
            const isSelected = selected.has(type)
            const isDanger = DANGER_SYMPTOMS.has(type)

            return (
              <motion.button
                key={type}
                type="button"
                onClick={() => toggleSymptom(type)}
                whileTap={{ scale: 0.95 }}
                className={`
                  rounded-xl border px-3 py-1.5 text-xs font-medium transition-all
                  ${isSelected
                    ? isDanger
                      ? 'border-red-400 bg-red-100 text-red-800'
                      : 'border-primary-400 bg-primary-100 text-primary-800'
                    : isDanger
                    ? 'border-red-200 bg-white text-red-500 hover:border-red-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200'
                  }
                `}
              >
                {SYMPTOM_LABELS[type]}
                {isDanger && ' ⚠️'}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Severity for selected */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3 overflow-hidden"
          >
            <p className="text-xs font-medium text-slate-500">شدت هر علامت:</p>
            {Array.from(selected.entries()).map(([type, severity]) => (
              <div key={type} className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-700 w-32 shrink-0">
                  {SYMPTOM_LABELS[type]}
                </span>
                <div className="flex gap-1">
                  {(['mild', 'moderate', 'severe'] as SymptomSeverity[]).map(
                    (s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSeverity(type, s)}
                        className={`
                          rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all
                          ${severity === s
                            ? SEVERITY_COLORS[s]
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }
                        `}
                      >
                        {SEVERITY_LABELS[s]}
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="توضیحات اضافی (اختیاری)..."
          className="w-full resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || selected.size === 0}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 py-3 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
      >
        <Send className="h-4 w-4" />
        {isPending ? 'در حال ثبت...' : 'ثبت علائم'}
      </button>
    </form>
  )
}