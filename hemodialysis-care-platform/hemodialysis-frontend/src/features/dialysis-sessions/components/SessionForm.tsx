// src/features/dialysis-sessions/components/SessionForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'motion/react'
import {
  Scale, Activity, AlertTriangle,
  CheckCircle, Clock, Droplets, X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { NumberInput } from '@/components/ui/NumberInput'
import { IDWGGauge } from './IDWGGauge'
import { calculateIDWG, SESSION_EVENTS_FA } from '@/lib/utils/medical.utils'
import { cn } from '@/lib/utils/cn'

// ---- Zod Schema ----
const sessionSchema = z
  .object({
    session_date: z.string().min(1, 'تاریخ الزامی است'),
    session_start_time: z.string().optional(),
    session_end_time: z.string().optional(),
    pre_weight: z
      .number({ required_error: 'وزن قبل الزامی است' })
      .min(20, 'وزن باید بیشتر از ۲۰ باشد')
      .max(250, 'وزن باید کمتر از ۲۵۰ باشد'),
    post_weight: z.number().min(20).max(250).optional(),
    bp_pre_systolic: z.number().min(60).max(250).optional(),
    bp_pre_diastolic: z.number().min(30).max(150).optional(),
    bp_during_systolic: z.number().min(60).max(250).optional(),
    bp_during_diastolic: z.number().min(30).max(150).optional(),
    bp_post_systolic: z.number().min(60).max(250).optional(),
    bp_post_diastolic: z.number().min(30).max(150).optional(),
    intradialytic_events: z.array(z.string()).optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine(
    (d) => {
      if (d.bp_pre_systolic && d.bp_pre_diastolic)
        return d.bp_pre_systolic > d.bp_pre_diastolic
      return true
    },
    { message: 'سیستولیک باید بزرگتر از دیاستولیک باشد', path: ['bp_pre_systolic'] }
  )
  .refine(
    (d) => {
      if (d.bp_during_systolic && d.bp_during_diastolic)
        return d.bp_during_systolic > d.bp_during_diastolic
      return true
    },
    { message: 'سیستولیک باید بزرگتر از دیاستولیک باشد', path: ['bp_during_systolic'] }
  )
  .refine(
    (d) => {
      if (d.bp_post_systolic && d.bp_post_diastolic)
        return d.bp_post_systolic > d.bp_post_diastolic
      return true
    },
    { message: 'سیستولیک باید بزرگتر از دیاستولیک باشد', path: ['bp_post_systolic'] }
  )

type SessionFormValues = z.infer<typeof sessionSchema>

interface Props {
  dryWeight: number
  onSubmit: (data: SessionFormValues) => Promise<void>
  isLoading?: boolean
  onCancel?: () => void
}

// ---- کامپوننت BP Row ----
function BPRow({
  label,
  sysField,
  diaField,
  register,
  errors,
  watch,
}: {
  label: string
  sysField: any
  diaField: any
  register: any
  errors: any
  watch: any
}) {
  const sys = watch(sysField)
  const dia = watch(diaField)

  const isInvalid = sys && dia && sys <= dia

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <div>
        <label className="text-xs text-text-muted mb-1 block">
          {label} — سیستولیک
        </label>
        <NumberInput
          {...register(sysField, { valueAsNumber: true })}
          unit="mmHg"
          placeholder="120"
          error={errors[sysField]?.message}
          className={isInvalid ? 'border-red-300' : ''}
        />
      </div>
      <span className="text-text-muted mt-5">/</span>
      <div>
        <label className="text-xs text-text-muted mb-1 block">دیاستولیک</label>
        <NumberInput
          {...register(diaField, { valueAsNumber: true })}
          unit="mmHg"
          placeholder="80"
        />
      </div>
    </div>
  )
}

// ---- کامپوننت اصلی ----
export function SessionForm({ dryWeight, onSubmit, isLoading, onCancel }: Props) {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      session_date: new Date().toISOString().split('T')[0],
      intradialytic_events: [],
    },
  })

  const preWeight = watch('pre_weight')
  const postWeight = watch('post_weight')
  const startTime = watch('session_start_time')
  const endTime = watch('session_end_time')

  // محاسبه IDWG
  const idwg = preWeight && dryWeight
    ? calculateIDWG(preWeight, dryWeight)
    : null

  // مدت جلسه
  const durationMinutes = (() => {
    if (!startTime || !endTime) return null
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const mins = (eh * 60 + em) - (sh * 60 + sm)
    return mins > 0 ? mins : null
  })()

  const toggleEvent = (event: string) => {
    const next = selectedEvents.includes(event)
      ? selectedEvents.filter((e) => e !== event)
      : [...selectedEvents, event]
    setSelectedEvents(next)
    setValue('intradialytic_events', next)
  }

  const handleFormSubmit = async (data: SessionFormValues) => {
    await onSubmit({ ...data, intradialytic_events: selectedEvents })
  }

  const steps = [
    { id: 1, label: 'وزن', icon: Scale },
    { id: 2, label: 'فشار خون', icon: Activity },
    { id: 3, label: 'رخدادها', icon: AlertTriangle },
  ]

  return (
    <div className="bg-white rounded-2xl border border-primary-100 shadow-azure overflow-hidden">
      {/* Step Indicator */}
      <div className="border-b border-primary-50 px-6 py-4">
        <div className="flex items-center gap-0">
          {steps.map((s, idx) => {
            const Icon = s.icon
            const isActive = s.id === step
            const isDone = s.id < step
            return (
              <div key={s.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setStep(s.id as 1 | 2 | 3)}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    animate={{
                      background: isDone
                        ? '#22C55E'
                        : isActive
                        ? '#0EA5E9'
                        : '#E0F2FE',
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: isActive || isDone ? '#fff' : '#64748B' }}
                    />
                  </motion.div>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isActive ? 'text-primary-600' : 'text-text-muted'
                    )}
                  >
                    {s.label}
                  </span>
                </button>
                {idx < steps.length - 1 && (
                  <div className="w-10 h-px bg-primary-100 mx-3" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="p-6">
          <AnimatePresence mode="wait">

            {/* ---- Step 1: وزن ---- */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* تاریخ و زمان */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="text-xs text-text-muted mb-1 block">
                      تاریخ جلسه *
                    </label>
                    <Input
                      type="date"
                      {...register('session_date')}
                      error={errors.session_date?.message}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">
                      ساعت شروع
                    </label>
                    <Input type="time" {...register('session_start_time')} />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">
                      ساعت پایان
                    </label>
                    <Input type="time" {...register('session_end_time')} />
                  </div>
                </div>

                {/* مدت محاسبه‌شده */}
                <AnimatePresence>
                  {durationMinutes && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 text-sm text-primary-600 bg-primary-50 rounded-xl px-4 py-2"
                    >
                      <Clock className="w-4 h-4" />
                      <span>مدت جلسه: {durationMinutes} دقیقه</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* وزن */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">
                      وزن قبل از دیالیز *
                    </label>
                    <NumberInput
                      {...register('pre_weight', { valueAsNumber: true })}
                      unit="kg"
                      placeholder="0.0"
                      error={errors.pre_weight?.message}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">
                      وزن بعد از دیالیز
                    </label>
                    <NumberInput
                      {...register('post_weight', { valueAsNumber: true })}
                      unit="kg"
                      placeholder="0.0"
                    />
                  </div>
                </div>

                {/* IDWG Live */}
                <AnimatePresence>
                  {idwg && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-surface-primary rounded-2xl p-4"
                    >
                      <p className="text-xs font-medium text-text-muted text-center mb-3">
                        محاسبه بلادرنگ IDWG
                      </p>
                      <IDWGGauge
                        percent={idwg.percent}
                        kg={idwg.kg}
                        dryWeight={dryWeight}
                      />

                      {idwg.status === 'critical' && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-red-700">
                            IDWG بیش از ۵٪ — این مقدار نیاز به توجه فوری دارد
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* UF */}
                {postWeight && preWeight && (
                  <div className="flex items-center gap-2 text-sm bg-cyan-50 rounded-xl px-4 py-2">
                    <Droplets className="w-4 h-4 text-cyan-500" />
                    <span className="text-cyan-700">
                      حجم UF تخمینی: {(preWeight - postWeight).toFixed(2)} L
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            {/* ---- Step 2: فشار خون ---- */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="space-y-4">
                  <div className="bg-surface-primary rounded-xl p-4">
                    <p className="text-sm font-medium text-text-primary mb-3">
                      فشار خون قبل از دیالیز
                    </p>
                    <BPRow
                      label="قبل"
                      sysField="bp_pre_systolic"
                      diaField="bp_pre_diastolic"
                      register={register}
                      errors={errors}
                      watch={watch}
                    />
                  </div>

                  <div className="bg-surface-primary rounded-xl p-4">
                    <p className="text-sm font-medium text-text-primary mb-3">
                      فشار خون حین دیالیز
                    </p>
                    <BPRow
                      label="حین"
                      sysField="bp_during_systolic"
                      diaField="bp_during_diastolic"
                      register={register}
                      errors={errors}
                      watch={watch}
                    />
                  </div>

                  <div className="bg-surface-primary rounded-xl p-4">
                    <p className="text-sm font-medium text-text-primary mb-3">
                      فشار خون بعد از دیالیز
                    </p>
                    <BPRow
                      label="بعد"
                      sysField="bp_post_systolic"
                      diaField="bp_post_diastolic"
                      register={register}
                      errors={errors}
                      watch={watch}
                    />
                  </div>
                </div>

                {/* راهنما */}
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-blue-700">
                    💡 اگر فشار خون حین دیالیز ثبت نشده، فقط قبل و بعد را وارد کنید.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ---- Step 3: رخدادها ---- */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary mb-3">
                    رخدادهای حین دیالیز
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(SESSION_EVENTS_FA).map(([key, label]) => {
                      const isSelected = selectedEvents.includes(key)
                      const isDanger = key === 'chest_pain'
                      return (
                        <motion.button
                          key={key}
                          type="button"
                          onClick={() => toggleEvent(key)}
                          whileTap={{ scale: 0.97 }}
                          className={cn(
                            'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm',
                            'border transition-all duration-200 text-right',
                            isSelected && !isDanger
                              ? 'bg-amber-50 border-amber-300 text-amber-700'
                              : isSelected && isDanger
                              ? 'bg-red-50 border-red-300 text-red-700'
                              : 'bg-white border-primary-100 text-text-secondary hover:border-primary-200'
                          )}
                        >
                          {isSelected
                            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            : <div className="w-4 h-4 rounded border border-current flex-shrink-0" />
                          }
                          <span>{label}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* یادداشت */}
                <div>
                  <label className="text-xs text-text-muted mb-1 block">
                    یادداشت (اختیاری)
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full rounded-xl border border-primary-100 px-4 py-3 text-sm
                               focus:outline-none focus:ring-2 focus:ring-primary-200
                               text-right font-vazir resize-none"
                    placeholder="یادداشت کلینیکی..."
                  />
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-primary-50 px-6 py-4 flex items-center justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              >
                قبلی
              </Button>
            )}
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                انصراف
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              >
                بعدی
              </Button>
            ) : (
              <Button type="submit" isLoading={isLoading}>
                ثبت جلسه
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}