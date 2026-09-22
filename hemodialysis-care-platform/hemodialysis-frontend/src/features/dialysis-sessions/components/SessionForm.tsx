'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Save, X, AlertTriangle } from 'lucide-react'
import type { SessionFormData } from '../types/session.types'
import type { SessionEvent } from '@/types/common.types'
import { todayISO } from '@/lib/utils/date.utils'

const SESSION_EVENTS: { value: SessionEvent; label: string }[] = [
  { value: 'hypotension', label: 'افت فشار خون' },
  { value: 'muscle_cramp', label: 'گرفتگی عضلانی' },
  { value: 'nausea_vomiting', label: 'تهوع/استفراغ' },
  { value: 'headache', label: 'سردرد' },
  { value: 'chest_pain', label: 'درد قفسه سینه' },
  { value: 'access_problem', label: 'مشکل در محل دسترسی' },
  { value: 'arrhythmia', label: 'آریتمی' },
  { value: 'allergic_reaction', label: 'واکنش آلرژیک' },
  { value: 'other', label: 'سایر' },
]

interface SessionFormProps {
  initialData?: Partial<SessionFormData>
  onSubmit: (data: SessionFormData) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

export function SessionForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: SessionFormProps) {
  const [form, setForm] = useState<SessionFormData>({
    session_date: todayISO(),
    pre_weight: 0,
    ...initialData,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (key: keyof SessionFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const toggleEvent = (event: SessionEvent) => {
    const current = form.intradialytic_events ?? []
    const updated = current.includes(event)
      ? current.filter((e) => e !== event)
      : [...current, event]
    set('intradialytic_events', updated)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.session_date) {
      newErrors.session_date = 'تاریخ جلسه الزامی است'
    }
    if (!form.pre_weight || form.pre_weight <= 0) {
      newErrors.pre_weight = 'وزن قبل از دیالیز الزامی است'
    }
    if (form.pre_weight && (form.pre_weight < 20 || form.pre_weight > 250)) {
      newErrors.pre_weight = 'وزن باید بین ۲۰ تا ۲۵۰ کیلوگرم باشد'
    }
    if (form.post_weight && form.pre_weight && form.post_weight > form.pre_weight) {
      newErrors.post_weight = 'وزن بعد نمی‌تواند بیشتر از وزن قبل باشد'
    }
    if (
      form.bp_pre_systolic &&
      form.bp_pre_diastolic &&
      form.bp_pre_systolic <= form.bp_pre_diastolic
    ) {
      newErrors.bp_pre = 'فشار سیستولیک باید بیشتر از دیاستولیک باشد'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload: SessionFormData = {
      ...form,
      pre_weight: Number(form.pre_weight),
      post_weight: form.post_weight ? Number(form.post_weight) : undefined,
      duration_minutes: form.duration_minutes
        ? Number(form.duration_minutes)
        : undefined,
    }

    await onSubmit(payload)
  }

  const hasDangerEvent = form.intradialytic_events?.includes('chest_pain')

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Danger warning */}
      {hasDangerEvent && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">
            درد قفسه سینه ثبت شده — اطمینان حاصل کنید بیمار ارزیابی شده است.
          </p>
        </motion.div>
      )}

      {/* Section: اطلاعات پایه */}
      <SectionCard title="اطلاعات پایه جلسه">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="تاریخ جلسه *" error={errors.session_date}>
            <input
              type="date"
              value={form.session_date}
              onChange={(e) => set('session_date', e.target.value)}
              max={todayISO()}
              className={inputCls(!!errors.session_date)}
              required
            />
          </Field>
          <Field label="مدت جلسه (دقیقه)">
            <input
              type="number"
              value={form.duration_minutes ?? ''}
              onChange={(e) =>
                set('duration_minutes', e.target.value ? Number(e.target.value) : undefined)
              }
              min={60}
              max={480}
              placeholder="مثلاً ۲۴۰"
              className={inputCls(false)}
            />
          </Field>
        </div>
      </SectionCard>

      {/* Section: وزن */}
      <SectionCard title="وزن">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="وزن قبل از دیالیز (kg) *" error={errors.pre_weight}>
            <input
              type="number"
              step="0.1"
              value={form.pre_weight || ''}
              onChange={(e) => set('pre_weight', Number(e.target.value))}
              placeholder="مثلاً ۸۳.۵"
              className={inputCls(!!errors.pre_weight)}
              required
            />
          </Field>
          <Field label="وزن بعد از دیالیز (kg)" error={errors.post_weight}>
            <input
              type="number"
              step="0.1"
              value={form.post_weight ?? ''}
              onChange={(e) =>
                set('post_weight', e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="مثلاً ۸۰.۰"
              className={inputCls(!!errors.post_weight)}
            />
          </Field>
        </div>
      </SectionCard>

      {/* Section: فشار خون */}
      <SectionCard title="فشار خون">
        <div className="space-y-4">
          {/* Before */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">قبل از دیالیز</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="سیستولیک" error={errors.bp_pre}>
                <input
                  type="number"
                  value={form.bp_pre_systolic ?? ''}
                  onChange={(e) =>
                    set('bp_pre_systolic', e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="مثلاً ۱۳۰"
                  className={inputCls(!!errors.bp_pre)}
                />
              </Field>
              <Field label="دیاستولیک">
                <input
                  type="number"
                  value={form.bp_pre_diastolic ?? ''}
                  onChange={(e) =>
                    set('bp_pre_diastolic', e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="مثلاً ۸۰"
                  className={inputCls(false)}
                />
              </Field>
            </div>
          </div>

          {/* During */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">حین دیالیز</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="سیستولیک">
                <input
                  type="number"
                  value={form.bp_during_systolic ?? ''}
                  onChange={(e) =>
                    set('bp_during_systolic', e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="مثلاً ۱۱۰"
                  className={inputCls(false)}
                />
              </Field>
              <Field label="دیاستولیک">
                <input
                  type="number"
                  value={form.bp_during_diastolic ?? ''}
                  onChange={(e) =>
                    set('bp_during_diastolic', e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="مثلاً ۷۰"
                  className={inputCls(false)}
                />
              </Field>
            </div>
          </div>

          {/* After */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">بعد از دیالیز</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="سیستولیک">
                <input
                  type="number"
                  value={form.bp_post_systolic ?? ''}
                  onChange={(e) =>
                    set('bp_post_systolic', e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="مثلاً ۱۲۰"
                  className={inputCls(false)}
                />
              </Field>
              <Field label="دیاستولیک">
                <input
                  type="number"
                  value={form.bp_post_diastolic ?? ''}
                  onChange={(e) =>
                    set('bp_post_diastolic', e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="مثلاً ۷۵"
                  className={inputCls(false)}
                />
              </Field>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section: رخدادها */}
      <SectionCard title="رخدادهای حین جلسه">
        <div className="flex flex-wrap gap-2">
          {SESSION_EVENTS.map(({ value, label }) => {
            const active = form.intradialytic_events?.includes(value)
            const isDanger = value === 'chest_pain'
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleEvent(value)}
                className={`
                  rounded-xl px-3 py-1.5 text-xs font-medium
                  border transition-all duration-150
                  ${
                    active
                      ? isDanger
                        ? 'border-red-300 bg-red-100 text-red-700'
                        : 'border-primary-300 bg-primary-50 text-primary-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }
                `}
              >
                {label}
              </button>
            )
          })}
        </div>
      </SectionCard>

      {/* Section: یادداشت */}
      <SectionCard title="یادداشت">
        <textarea
          value={form.notes ?? ''}
          onChange={(e) => set('notes', e.target.value || undefined)}
          rows={3}
          placeholder="یادداشت اضافی درباره این جلسه..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 resize-none"
        />
      </SectionCard>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          انصراف
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? 'در حال ذخیره...' : 'ذخیره جلسه'}
        </button>
      </div>
    </form>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">{title}</h3>
      {children}
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function inputCls(hasError: boolean): string {
  return `
    w-full rounded-xl border px-3 py-2.5 text-sm text-slate-800
    placeholder:text-slate-400
    focus:outline-none focus:ring-2
    transition-colors
    ${
      hasError
        ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
        : 'border-slate-200 bg-slate-50/50 focus:border-primary-300 focus:bg-white focus:ring-primary-100'
    }
  `
}