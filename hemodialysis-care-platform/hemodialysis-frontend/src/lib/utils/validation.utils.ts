import { z } from 'zod'
import type { LabTestCode, SymptomType, SymptomSeverity } from '@appTypes/common.types'

const IRAN_PHONE_REGEX = /^09[0-9]{9}$/

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  phone_number: z
    .string()
    .min(1, 'شماره موبایل الزامی است')
    .regex(IRAN_PHONE_REGEX, 'فرمت شماره موبایل صحیح نیست (مثال: 09123456789)'),
  password: z
    .string()
    .min(1, 'رمز عبور الزامی است')
    .min(8, 'رمز عبور حداقل ۸ کاراکتر باشد'),
})

export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, 'رمز عبور فعلی الزامی است'),
    new_password: z.string().min(8, 'رمز عبور جدید حداقل ۸ کاراکتر باشد'),
    confirm_password: z.string().min(1, 'تکرار رمز عبور الزامی است'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'رمز عبور و تکرار آن یکسان نیستند',
    path: ['confirm_password'],
  })

// ─── Patient ──────────────────────────────────────────────────────────────────
export const createPatientSchema = z.object({
  medical_record_number: z.string().min(1, 'کد بیمارستانی الزامی است'),
  full_name: z.string().min(2, 'نام حداقل ۲ کاراکتر باشد'),
  phone_number: z
    .string()
    .regex(IRAN_PHONE_REGEX, 'فرمت شماره موبایل صحیح نیست')
    .optional()
    .or(z.literal('')),
  date_of_birth: z.string().min(1, 'تاریخ تولد الزامی است'),
  gender: z.enum(['male', 'female'], { required_error: 'جنسیت را انتخاب کنید' }),
  dry_weight: z
    .number({ invalid_type_error: 'وزن خشک را وارد کنید' })
    .min(20, 'وزن خشک حداقل ۲۰ کیلوگرم')
    .max(250, 'وزن خشک حداکثر ۲۵۰ کیلوگرم'),
  vascular_access_type: z.enum(['fistula', 'graft', 'catheter']),
  dialysis_frequency: z.number().min(1).max(7),
  dialysis_start_date: z.string().min(1, 'تاریخ شروع دیالیز الزامی است'),
})

// ─── Dialysis Session ─────────────────────────────────────────────────────────
const bpPairSchema = z
  .object({
    systolic: z.number().min(60).max(250).optional(),
    diastolic: z.number().min(30).max(150).optional(),
  })
  .refine(
    (d) => {
      if (d.systolic && d.diastolic) return d.systolic > d.diastolic
      return true
    },
    { message: 'فشار سیستولیک باید بزرگ‌تر از دیاستولیک باشد', path: ['diastolic'] }
  )

export const dialysisSessionSchema = z
  .object({
    session_date: z.string().min(1, 'تاریخ جلسه الزامی است'),
    session_start_time: z.string().optional(),
    session_end_time: z.string().optional(),
    duration_minutes: z.number().min(60).max(480).optional(),
    pre_weight: z
      .number({ invalid_type_error: 'وزن قبل از دیالیز را وارد کنید' })
      .min(20, 'وزن حداقل ۲۰ کیلوگرم')
      .max(250, 'وزن حداکثر ۲۵۰ کیلوگرم'),
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
      if (d.bp_pre_systolic && d.bp_pre_diastolic) {
        return d.bp_pre_systolic > d.bp_pre_diastolic
      }
      return true
    },
    { message: 'فشار سیستولیک قبل باید بزرگ‌تر از دیاستولیک باشد', path: ['bp_pre_diastolic'] }
  )
  .refine(
    (d) => {
      if (d.bp_during_systolic && d.bp_during_diastolic) {
        return d.bp_during_systolic > d.bp_during_diastolic
      }
      return true
    },
    { message: 'فشار سیستولیک حین باید بزرگ‌تر از دیاستولیک باشد', path: ['bp_during_diastolic'] }
  )
  .refine(
    (d) => {
      if (d.bp_post_systolic && d.bp_post_diastolic) {
        return d.bp_post_systolic > d.bp_post_diastolic
      }
      return true
    },
    { message: 'فشار سیستولیک بعد باید بزرگ‌تر از دیاستولیک باشد', path: ['bp_post_diastolic'] }
  )
  .refine(
    (d) => {
      if (d.post_weight && d.pre_weight) return d.post_weight <= d.pre_weight
      return true
    },
    { message: 'وزن بعد از دیالیز نمی‌تواند بیشتر از وزن قبل باشد', path: ['post_weight'] }
  )

// ─── Lab Panel ────────────────────────────────────────────────────────────────
export const labPanelSchema = z.object({
  collected_at: z.string().min(1, 'تاریخ نمونه‌گیری الزامی است'),
  reported_at: z.string().optional(),
  notes: z.string().max(500).optional(),
  results: z
    .array(
      z.object({
        test_code: z.string().min(1),
        value: z.number({ invalid_type_error: 'مقدار آزمایش را وارد کنید' }),
        unit: z.string().min(1),
      })
    )
    .min(1, 'حداقل یک نتیجه آزمایش وارد کنید'),
})

// ─── Symptom Report ───────────────────────────────────────────────────────────
export const symptomReportSchema = z.object({
  reported_at: z.string().optional(),
  symptoms: z
    .array(
      z.object({
        type: z.string().min(1) as z.ZodType<SymptomType>,
        severity: z.enum(['mild', 'moderate', 'severe']) as z.ZodType<SymptomSeverity>,
      })
    )
    .min(1, 'حداقل یک علامت انتخاب کنید'),
  notes: z.string().max(500).optional(),
  related_session_id: z.string().optional(),
})

// ─── Fluid Log ────────────────────────────────────────────────────────────────
export const fluidLogSchema = z.object({
  log_date: z.string().min(1, 'تاریخ الزامی است'),
  total_ml: z
    .number({ invalid_type_error: 'مقدار مایعات را وارد کنید' })
    .min(0, 'مقدار نمی‌تواند منفی باشد')
    .max(5000, 'مقدار حداکثر ۵۰۰۰ میلی‌لیتر'),
  notes: z.string().max(300).optional(),
})

// ─── Diet Log ─────────────────────────────────────────────────────────────────
export const dietLogSchema = z.object({
  log_date: z.string().min(1, 'تاریخ الزامی است'),
  potassium_adherence: z.enum(['good', 'moderate', 'poor']),
  phosphorus_adherence: z.enum(['good', 'moderate', 'poor']),
  protein_adherence: z.enum(['good', 'moderate', 'poor']),
  sodium_adherence: z.enum(['good', 'moderate', 'poor']),
  notes: z.string().max(300).optional(),
})

// ─── User Form ────────────────────────────────────────────────────────────────
export const createUserSchema = z.object({
  phone_number: z
    .string()
    .regex(IRAN_PHONE_REGEX, 'فرمت شماره موبایل صحیح نیست'),
  full_name: z.string().min(2, 'نام حداقل ۲ کاراکتر'),
  role: z.enum(['patient', 'clinician', 'admin']),
  password: z.string().min(8, 'رمز عبور حداقل ۸ کاراکتر'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type CreatePatientInput = z.infer<typeof createPatientSchema>
export type DialysisSessionInput = z.infer<typeof dialysisSessionSchema>
export type LabPanelInput = z.infer<typeof labPanelSchema>
export type SymptomReportInput = z.infer<typeof symptomReportSchema>
export type FluidLogInput = z.infer<typeof fluidLogSchema>
export type DietLogInput = z.infer<typeof dietLogSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>