"use client";

import { useState, useCallback } from "react";
import { useForm, type FieldValues, type Path, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "motion/react";
import { X, Droplets, Heart, AlertCircle, Scale } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCreateSession } from "../hooks/useSessions";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import type { SessionEvent } from "@/types/common.types";

// ── Schema ────────────────────────────────────
const sessionSchema = z
  .object({
    session_date: z.string().min(1, "تاریخ جلسه الزامی است"),
    pre_weight: z.number({ invalid_type_error: "وزن را وارد کنید" })
      .min(20).max(250),
    post_weight: z.number().min(20).max(250).optional(),
    bp_pre_systolic: z.number().min(60).max(250).optional(),
    bp_pre_diastolic: z.number().min(30).max(150).optional(),
    bp_during_systolic: z.number().min(60).max(250).optional(),
    bp_during_diastolic: z.number().min(30).max(150).optional(),
    bp_post_systolic: z.number().min(60).max(250).optional(),
    bp_post_diastolic: z.number().min(30).max(150).optional(),
    duration_minutes: z.number().min(60).max(480).optional(),
    notes: z.string().optional(),
  })
  .refine(
    (d) =>
      !d.bp_pre_systolic ||
      !d.bp_pre_diastolic ||
      d.bp_pre_systolic > d.bp_pre_diastolic,
    { message: "فشار سیستولیک باید بیشتر از دیاستولیک باشد", path: ["bp_pre_systolic"] }
  );

type FormData = z.infer<typeof sessionSchema>;

// ── Helper: IDWG Calculator ───────────────────
function IDWGCalculator({
  preWeight,
  dryWeight,
}: {
  preWeight?: number;
  dryWeight: number;
}) {
  if (!preWeight || preWeight <= 0) return null;

  const gain = preWeight - dryWeight;
  const percent = dryWeight > 0 ? (gain / dryWeight) * 100 : 0;
  const status =
    percent >= 5 ? "critical"
    : percent >= 3 ? "warning"
    : "ok";

  const cfg = {
    critical: { bg: "bg-red-50 border-red-200", text: "text-red-700", label: "⚠️ بحرانی — نیاز به توجه فوری" },
    warning: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: "هشدار — بالاتر از حد مجاز" },
    ok: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "طبیعی" },
  }[status];

  return (
    <motion.div
      className={cn("rounded-xl border p-3", cfg.bg)}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">اضافه وزن نسبت به وزن خشک</p>
          <p className={cn("text-sm font-bold mt-0.5", cfg.text)}>
            {gain > 0 ? "+" : ""}
            {gain.toFixed(1)} kg{" "}
            <span className="font-normal text-xs">
              ({percent.toFixed(1)}% IDWG)
            </span>
          </p>
        </div>
        <span className={cn("text-xs font-medium", cfg.text)}>{cfg.label}</span>
      </div>
    </motion.div>
  );
}

// ── BP Input Pair ─────────────────────────────
function BPInputPair<T extends FieldValues>({
  label,
  sysName,
  diasName,
  register,
  errors,
}: {
  label: string;
  sysName: Path<T>;
  diasName: Path<T>;
  register: UseFormRegister<T>;
  errors: Record<string, { message?: string } | undefined>;
}) {
  const inputCls = (hasError: boolean) =>
    cn(
      "w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-800",
      "placeholder:text-slate-300 outline-none transition-all",
      "focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400",
      hasError
        ? "border-red-300"
        : "border-primary-100 hover:border-primary-200"
    );

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <p className="mb-2 text-xs font-medium text-slate-500">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[10px] text-slate-400">
            سیستولیک (mmHg)
          </label>
          <input
            {...register(sysName, { valueAsNumber: true })}
            type="number"
            placeholder="مثلاً 130"
            dir="ltr"
            className={inputCls(Boolean(errors[sysName]))}
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] text-slate-400">
            دیاستولیک (mmHg)
          </label>
          <input
            {...register(diasName, { valueAsNumber: true })}
            type="number"
            placeholder="مثلاً 80"
            dir="ltr"
            className={inputCls(Boolean(errors[diasName]))}
          />
        </div>
      </div>
      {errors[sysName] && (
        <p className="mt-1 text-[10px] text-red-500">
          {errors[sysName]?.message}
        </p>
      )}
    </div>
  );
}

// ── Events Checklist ──────────────────────────
const SESSION_EVENTS: Array<{ value: SessionEvent; label: string }> = [
  { value: "hypotension", label: "افت فشار خون" },
  { value: "muscle_cramp", label: "کرامپ عضلانی" },
  { value: "nausea_vomiting", label: "تهوع / استفراغ" },
  { value: "headache", label: "سردرد" },
  { value: "chest_pain", label: "درد قفسه سینه" },
  { value: "access_problem", label: "مشکل دسترسی عروقی" },
  { value: "other", label: "سایر" },
];

// ── Main Form ─────────────────────────────────
interface SessionFormProps {
  patientId: string;
  dryWeight: number;
  onClose: () => void;
}

export function SessionForm({ patientId, dryWeight, onClose }: SessionFormProps) {
  const [selectedEvents, setSelectedEvents] = useState<SessionEvent[]>([]);
  const createMutation = useCreateSession(patientId);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      session_date: new Date().toISOString().split("T")[0],
    },
  });

  const preWeight = watch("pre_weight");

  const toggleEvent = useCallback((event: SessionEvent) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  }, []);

  const onSubmit = async (data: FormData) => {
    await createMutation.mutateAsync({
      ...data,
      intradialytic_events: selectedEvents,
    });
    onClose();
  };

  const inputCls = (hasError?: boolean) =>
    cn(
      "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-800",
      "placeholder:text-slate-400 outline-none transition-all",
      "focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400",
      hasError
        ? "border-red-300"
        : "border-primary-100 hover:border-primary-200"
    );

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Overlay */}
      <motion.div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl"
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
              <Droplets className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                ثبت جلسه دیالیز
              </h3>
              <p className="text-xs text-slate-400">
                وزن خشک: {dryWeight.toFixed(1)} kg
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 text-slate-400 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto"
        >
          <div className="space-y-5 p-5">
            {/* Date + Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  تاریخ جلسه <span className="text-red-400">*</span>
                </label>
                <input
                  {...register("session_date")}
                  type="date"
                  dir="ltr"
                  className={inputCls(Boolean(errors.session_date))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  مدت جلسه (دقیقه)
                </label>
                <input
                  {...register("duration_minutes", { valueAsNumber: true })}
                  type="number"
                  placeholder="مثلاً 240"
                  dir="ltr"
                  className={inputCls()}
                />
              </div>
            </div>

            {/* Weight section */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <Scale className="h-3.5 w-3.5 text-primary-400" />
                وزن
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs text-slate-500">
                    وزن قبل (kg) <span className="text-red-400">*</span>
                  </label>
                  <input
                    {...register("pre_weight", { valueAsNumber: true })}
                    type="number"
                    step="0.1"
                    placeholder="مثلاً 72.5"
                    dir="ltr"
                    className={inputCls(Boolean(errors.pre_weight))}
                  />
                  {errors.pre_weight && (
                    <p className="mt-1 text-[10px] text-red-500">
                      {errors.pre_weight.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-500">
                    وزن بعد (kg)
                  </label>
                  <input
                    {...register("post_weight", { valueAsNumber: true })}
                    type="number"
                    step="0.1"
                    placeholder="مثلاً 70.0"
                    dir="ltr"
                    className={inputCls()}
                  />
                </div>
              </div>

              {/* IDWG Calculator */}
              <div className="mt-3">
                <IDWGCalculator preWeight={preWeight} dryWeight={dryWeight} />
              </div>
            </div>

            {/* BP section */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <Heart className="h-3.5 w-3.5 text-rose-400" />
                فشار خون
              </p>
              <div className="space-y-3">
                <BPInputPair
                  label="قبل از دیالیز"
                  sysName="bp_pre_systolic"
                  diasName="bp_pre_diastolic"
                  register={register}
                  errors={errors as Record<string, { message?: string } | undefined>}
                />
                <BPInputPair
                  label="حین دیالیز (پایین‌ترین)"
                  sysName="bp_during_systolic"
                  diasName="bp_during_diastolic"
                  register={register}
                  errors={errors as Record<string, { message?: string } | undefined>}
                />
                <BPInputPair
                  label="بعد از دیالیز"
                  sysName="bp_post_systolic"
                  diasName="bp_post_diastolic"
                  register={register}
                  errors={errors as Record<string, { message?: string } | undefined>}
                />
              </div>
            </div>

            {/* Events */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                رخدادهای حین دیالیز
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SESSION_EVENTS.map((ev) => (
                  <motion.button
                    key={ev.value}
                    type="button"
                    onClick={() => toggleEvent(ev.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all",
                      selectedEvents.includes(ev.value)
                        ? "border-primary-400 bg-primary-50 text-primary-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-primary-200"
                    )}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div
                      className={cn(
                        "h-3.5 w-3.5 flex-shrink-0 rounded border-2 transition-all",
                        selectedEvents.includes(ev.value)
                          ? "border-primary-500 bg-primary-500"
                          : "border-slate-300"
                      )}
                    />
                    {ev.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                یادداشت
              </label>
              <textarea
                {...register("notes")}
                rows={3}
                placeholder="یادداشت پرستار..."
                className={cn(inputCls(), "resize-none")}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex gap-3 border-t border-slate-100 bg-white p-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              انصراف
            </button>
            <motion.button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white transition-all",
                isSubmitting || createMutation.isPending
                  ? "cursor-not-allowed bg-primary-300"
                  : "bg-primary-500 hover:bg-primary-600 shadow-sm"
              )}
              whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
            >
              {isSubmitting || createMutation.isPending ? (
                <motion.div
                  className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              ) : null}
              {isSubmitting || createMutation.isPending ? "در حال ثبت..." : "ثبت جلسه"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}