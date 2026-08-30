"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "motion/react";
import { User, Phone, Scale, Calendar, Activity, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCreatePatient, useUpdatePatient } from "../hooks/usePatients";
import type { Patient, CreatePatientForm } from "../types/patient.types";

// ── Schema ────────────────────────────────────
const schema = z.object({
  medical_record_number: z.string().min(1, "کد بیمارستانی الزامی است"),
  full_name: z.string().min(2, "نام حداقل ۲ کاراکتر باشد"),
  date_of_birth: z.string().min(1, "تاریخ تولد الزامی است"),
  gender: z.enum(["male", "female"]),
  phone_number: z
    .string()
    .regex(/^09\d{9}$/, "شماره موبایل معتبر وارد کنید (09XXXXXXXXX)"),
  dry_weight: z
    .number({ invalid_type_error: "عدد وارد کنید" })
    .min(20, "وزن حداقل ۲۰ کیلوگرم")
    .max(250, "وزن حداکثر ۲۵۰ کیلوگرم"),
  vascular_access_type: z.enum(["fistula", "graft", "catheter"]),
  dialysis_frequency: z.coerce.number().min(1).max(4),
  dialysis_start_date: z.string().min(1, "تاریخ شروع دیالیز الزامی است"),
});

type FormData = z.infer<typeof schema>;

// ── Field Component ───────────────────────────
function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            className="text-xs text-red-500"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCls = (hasError?: boolean) =>
  cn(
    "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-800",
    "placeholder:text-slate-400 outline-none transition-all duration-200",
    "focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400",
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-200/40"
      : "border-primary-100 hover:border-primary-200"
  );

// ── Main Component ────────────────────────────
interface PatientFormProps {
  patient?: Patient;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PatientForm({ patient, onSuccess, onCancel }: PatientFormProps) {
  const isEdit = Boolean(patient);
  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient(patient?.id ?? "");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: patient
      ? {
          medical_record_number: patient.medical_record_number,
          full_name: patient.full_name,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender,
          phone_number: patient.phone_number,
          dry_weight: patient.dry_weight,
          vascular_access_type: patient.vascular_access_type,
          dialysis_frequency: patient.dialysis_frequency,
          dialysis_start_date: patient.dialysis_start_date,
        }
      : {
          gender: "male",
          vascular_access_type: "fistula",
          dialysis_frequency: 3,
        },
  });

  const onSubmit = async (data: FormData) => {
    const payload: CreatePatientForm = {
      ...data,
      dry_weight: Number(data.dry_weight),
      dialysis_frequency: Number(data.dialysis_frequency) as 1 | 2 | 3 | 4,
    };

    if (isEdit) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
    }
    onSuccess?.();
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Section: اطلاعات هویتی */}
      <div>
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <User className="h-3.5 w-3.5" />
          اطلاعات هویتی
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="کد بیمارستانی"
            error={errors.medical_record_number?.message}
            required
          >
            <input
              {...register("medical_record_number")}
              className={inputCls(!!errors.medical_record_number)}
              placeholder="مثال: MRN-001"
              dir="ltr"
            />
          </FormField>

          <FormField
            label="نام و نام خانوادگی"
            error={errors.full_name?.message}
            required
          >
            <input
              {...register("full_name")}
              className={inputCls(!!errors.full_name)}
              placeholder="نام کامل بیمار"
            />
          </FormField>

          <FormField
            label="جنسیت"
            error={errors.gender?.message}
            required
          >
            <select {...register("gender")} className={inputCls(!!errors.gender)}>
              <option value="male">مرد</option>
              <option value="female">زن</option>
            </select>
          </FormField>

          <FormField
            label="تاریخ تولد"
            error={errors.date_of_birth?.message}
            required
          >
            <input
              {...register("date_of_birth")}
              type="date"
              className={inputCls(!!errors.date_of_birth)}
              dir="ltr"
            />
          </FormField>

          <FormField
            label="شماره موبایل"
            error={errors.phone_number?.message}
            required
          >
            <input
              {...register("phone_number")}
              className={inputCls(!!errors.phone_number)}
              placeholder="09XXXXXXXXX"
              dir="ltr"
              maxLength={11}
            />
          </FormField>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary-100 to-transparent" />

      {/* Section: اطلاعات بالینی */}
      <div>
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <Activity className="h-3.5 w-3.5" />
          اطلاعات بالینی
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="وزن خشک (kg)"
            error={errors.dry_weight?.message}
            required
          >
            <input
              {...register("dry_weight", { valueAsNumber: true })}
              type="number"
              step="0.1"
              className={inputCls(!!errors.dry_weight)}
              placeholder="مثال: 68.5"
              dir="ltr"
            />
          </FormField>

          <FormField
            label="نوع دسترسی عروقی"
            error={errors.vascular_access_type?.message}
            required
          >
            <select
              {...register("vascular_access_type")}
              className={inputCls(!!errors.vascular_access_type)}
            >
              <option value="fistula">فیستول</option>
              <option value="graft">گرافت</option>
              <option value="catheter">کاتتر</option>
            </select>
          </FormField>

          <FormField
            label="تعداد جلسات در هفته"
            error={errors.dialysis_frequency?.message}
            required
          >
            <select
              {...register("dialysis_frequency", { valueAsNumber: true })}
              className={inputCls(!!errors.dialysis_frequency)}
            >
              <option value={2}>۲ جلسه</option>
              <option value={3}>۳ جلسه (استاندارد)</option>
              <option value={4}>۴ جلسه</option>
            </select>
          </FormField>

          <FormField
            label="تاریخ شروع دیالیز"
            error={errors.dialysis_start_date?.message}
            required
          >
            <input
              {...register("dialysis_start_date")}
              type="date"
              className={inputCls(!!errors.dialysis_start_date)}
              dir="ltr"
            />
          </FormField>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <X className="h-4 w-4" />
            انصراف
          </button>
        )}
        <motion.button
          type="submit"
          disabled={isPending}
          className={cn(
            "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all",
            isPending
              ? "cursor-not-allowed bg-primary-300"
              : "bg-primary-500 hover:bg-primary-600 shadow-sm"
          )}
          whileHover={{ scale: isPending ? 1 : 1.02 }}
          whileTap={{ scale: isPending ? 1 : 0.98 }}
        >
          {isPending ? (
            <>
              <motion.div
                className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              در حال ذخیره...
            </>
          ) : isEdit ? (
            "ذخیره تغییرات"
          ) : (
            "ایجاد بیمار"
          )}
        </motion.button>
      </div>
    </form>
  );
}