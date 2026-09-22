'use client'

import { useState } from 'react'
import { Save, X } from 'lucide-react'
import { useCreatePatient, useUpdatePatient } from '../hooks/usePatients'
import type {
  CreatePatientRequest,
  PatientDetail,
} from '../types/patient.types'

interface PatientFormProps {
  initialData?: PatientDetail
  onSuccess?: (id: string) => void
  onCancel?: () => void
}

type FormData = CreatePatientRequest

const VASCULAR_OPTIONS = [
  { value: 'fistula', label: 'فیستول' },
  { value: 'graft', label: 'گرافت' },
  { value: 'catheter', label: 'کاتتر' },
]

export function PatientForm({
  initialData,
  onSuccess,
  onCancel,
}: PatientFormProps) {
  const isEdit = !!initialData
  const createMutation = useCreatePatient()
  const updateMutation = useUpdatePatient(initialData?.id ?? '')

  const [form, setForm] = useState<FormData>({
    medical_record_number: initialData?.medical_record_number ?? '',
    full_name: initialData?.full_name ?? '',
    date_of_birth: initialData?.date_of_birth ?? '',
    gender: initialData?.gender ?? 'male',
    phone_number: initialData?.phone_number ?? '',
    dry_weight: initialData?.dry_weight ?? undefined,
    vascular_access_type: initialData?.vascular_access_type ?? undefined,
    dialysis_frequency: initialData?.dialysis_frequency ?? 3,
    dialysis_start_date: initialData?.dialysis_start_date ?? '',
    create_user_account: !isEdit,
    password: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  )

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (!form.medical_record_number.trim())
      e.medical_record_number = 'کد بیمارستانی الزامی است'
    if (!form.full_name.trim()) e.full_name = 'نام کامل الزامی است'
    if (!form.date_of_birth) e.date_of_birth = 'تاریخ تولد الزامی است'
    if (!form.phone_number.trim()) e.phone_number = 'شماره موبایل الزامی است'
    if (form.dry_weight && (form.dry_weight < 20 || form.dry_weight > 250))
      e.dry_weight = 'وزن باید بین ۲۰ تا ۲۵۰ کیلوگرم باشد'
    if (!isEdit && form.create_user_account && !form.password)
      e.password = 'رمز عبور برای ایجاد حساب الزامی است'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload: FormData = {
      ...form,
      dry_weight: form.dry_weight ? Number(form.dry_weight) : undefined,
      dialysis_frequency: form.dialysis_frequency
        ? Number(form.dialysis_frequency)
        : undefined,
      dialysis_start_date: form.dialysis_start_date || undefined,
      password: form.password || undefined,
    }

    if (isEdit) {
      const result = await updateMutation.mutateAsync(payload)
      onSuccess?.(result.id)
    } else {
      const result = await createMutation.mutateAsync(payload)
      onSuccess?.(result.id)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Basic info */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">اطلاعات پایه</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup
            label="نام کامل *"
            error={errors.full_name}
          >
            <input
              value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)}
              className={inputCls(!!errors.full_name)}
              placeholder="نام و نام خانوادگی"
            />
          </FieldGroup>

          <FieldGroup
            label="کد بیمارستانی *"
            error={errors.medical_record_number}
          >
            <input
              value={form.medical_record_number}
              onChange={(e) =>
                set('medical_record_number', e.target.value)
              }
              className={inputCls(!!errors.medical_record_number)}
              placeholder="مثلاً DL-001"
              disabled={isEdit}
            />
          </FieldGroup>

          <FieldGroup label="جنسیت">
            <select
              value={form.gender}
              onChange={(e) =>
                set('gender', e.target.value as 'male' | 'female')
              }
              className={inputCls(false)}
            >
              <option value="male">مرد</option>
              <option value="female">زن</option>
            </select>
          </FieldGroup>

          <FieldGroup label="تاریخ تولد *" error={errors.date_of_birth}>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => set('date_of_birth', e.target.value)}
              className={inputCls(!!errors.date_of_birth)}
            />
          </FieldGroup>

          <FieldGroup label="شماره موبایل *" error={errors.phone_number}>
            <input
              type="tel"
              dir="ltr"
              value={form.phone_number}
              onChange={(e) => set('phone_number', e.target.value)}
              className={inputCls(!!errors.phone_number)}
              placeholder="09XXXXXXXXX"
            />
          </FieldGroup>
        </div>
      </div>

      {/* Clinical info */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">اطلاعات بالینی</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup label="وزن خشک (kg)" error={errors.dry_weight}>
            <input
              type="number"
              step="0.1"
              value={form.dry_weight ?? ''}
              onChange={(e) =>
                set(
                  'dry_weight',
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              className={inputCls(!!errors.dry_weight)}
              placeholder="مثلاً ۷۵.۵"
            />
          </FieldGroup>

          <FieldGroup label="نوع دسترسی عروقی">
            <select
              value={form.vascular_access_type ?? ''}
              onChange={(e) =>
                set(
                  'vascular_access_type',
                  (e.target.value as 'fistula' | 'graft' | 'catheter') ||
                    undefined
                )
              }
              className={inputCls(false)}
            >
              <option value="">انتخاب کنید</option>
              {VASCULAR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup label="تعداد جلسات در هفته">
            <select
              value={form.dialysis_frequency ?? 3}
              onChange={(e) =>
                set('dialysis_frequency', Number(e.target.value))
              }
              className={inputCls(false)}
            >
              <option value={2}>۲ بار</option>
              <option value={3}>۳ بار</option>
              <option value={4}>۴ بار</option>
            </select>
          </FieldGroup>

          <FieldGroup label="تاریخ شروع دیالیز">
            <input
              type="date"
              value={form.dialysis_start_date ?? ''}
              onChange={(e) =>
                set('dialysis_start_date', e.target.value || undefined)
              }
              className={inputCls(false)}
            />
          </FieldGroup>
        </div>
      </div>

      {/* Account */}
      {!isEdit && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-700">
              حساب کاربری
            </h3>
            <label className="flex items-center gap-2 mr-auto">
              <input
                type="checkbox"
                checked={form.create_user_account}
                onChange={(e) =>
                  set('create_user_account', e.target.checked)
                }
                className="rounded accent-[#0EA5E9]"
              />
              <span className="text-xs text-slate-600">
                ایجاد حساب برای بیمار
              </span>
            </label>
          </div>

          {form.create_user_account && (
            <FieldGroup label="رمز عبور اولیه *" error={errors.password}>
              <input
                type="password"
                value={form.password ?? ''}
                onChange={(e) => set('password', e.target.value)}
                className={inputCls(!!errors.password)}
                placeholder="حداقل ۸ کاراکتر"
              />
            </FieldGroup>
          )}
        </div>
      )}

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
          className="flex items-center gap-2 rounded-xl bg-[#0EA5E9] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0284C7] disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isPending
            ? 'در حال ذخیره...'
            : isEdit
            ? 'ذخیره تغییرات'
            : 'ثبت بیمار'}
        </button>
      </div>
    </form>
  )
}

function FieldGroup({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-600">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function inputCls(hasError: boolean) {
  return `
    w-full rounded-xl border px-3 py-2.5 text-sm
    focus:outline-none focus:ring-2 transition-colors
    ${
      hasError
        ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100 text-red-800'
        : 'border-slate-200 bg-slate-50/50 focus:border-[#0EA5E9] focus:bg-white focus:ring-[#0EA5E9]/15 text-slate-800'
    }
  `
}