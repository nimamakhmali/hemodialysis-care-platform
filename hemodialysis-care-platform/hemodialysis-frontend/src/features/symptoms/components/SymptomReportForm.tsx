// src/features/symptoms/components/SymptomReportForm.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, AlertTriangle, Send } from "lucide-react";
import { useCreateSymptomReport } from "../hooks/useSymptoms";
import {
  SYMPTOM_LABELS,
  SYMPTOM_EMOJIS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  DANGER_SYMPTOMS,
  type SymptomType,
  type SymptomSeverity,
  type SymptomItem,
} from "../types/symptom.types";
import { cn } from "@/lib/utils/cn";
import { todayISO } from "@/lib/utils/date.utils";

const ALL_SYMPTOMS = Object.keys(SYMPTOM_LABELS) as SymptomType[];

interface Props {
  patientId: string;
}

export function SymptomReportForm({ patientId }: Props) {
  const [selected, setSelected] = useState<Map<SymptomType, SymptomSeverity>>(
    new Map()
  );
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const createReport = useCreateSymptomReport(patientId);

  const hasDanger = Array.from(selected.keys()).some((t) =>
    DANGER_SYMPTOMS.includes(t)
  );
  const hasSevereDanger = Array.from(selected.entries()).some(
    ([t, s]) => DANGER_SYMPTOMS.includes(t) && s === "severe"
  );

  function toggleSymptom(type: SymptomType) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.set(type, "mild");
      }
      return next;
    });
  }

  function setSeverity(type: SymptomType, severity: SymptomSeverity) {
    setSelected((prev) => {
      const next = new Map(prev);
      next.set(type, severity);
      return next;
    });
  }

  async function handleSubmit() {
    if (selected.size === 0) return;

    const symptoms: SymptomItem[] = Array.from(selected.entries()).map(
      ([type, severity]) => ({ type, severity })
    );

    await createReport.mutateAsync({
      symptoms,
      notes: notes.trim() || undefined,
      reported_at: new Date().toISOString(),
    });

    setSubmitted(true);
    setSelected(new Map());
    setNotes("");
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-1">
          امروز چه حالی داری؟
        </h2>
        <p className="text-sm text-slate-500">
          علائمی که داری را انتخاب کن
        </p>
      </div>

      {/* Symptom Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ALL_SYMPTOMS.map((type) => {
          const isSelected = selected.has(type);
          const severity = selected.get(type);
          const isDanger = DANGER_SYMPTOMS.includes(type);

          return (
            <div key={type} className="space-y-2">
              <motion.button
                onClick={() => toggleSymptom(type)}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "w-full rounded-2xl border-2 p-4 text-center transition-all",
                  isSelected
                    ? isDanger
                      ? "border-red-300 bg-red-50"
                      : "border-sky-300 bg-sky-50"
                    : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                )}
              >
                <div className="text-2xl mb-1">
                  {SYMPTOM_EMOJIS[type]}
                </div>
                <p
                  className={cn(
                    "text-xs font-medium",
                    isSelected
                      ? isDanger
                        ? "text-red-700"
                        : "text-sky-700"
                      : "text-slate-600"
                  )}
                >
                  {SYMPTOM_LABELS[type]}
                </p>
                {isSelected && (
                  <div className="mt-1">
                    <div className="w-4 h-4 rounded-full bg-sky-500 mx-auto 
                                    flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </motion.button>

              {/* Severity selector */}
              <AnimatePresence>
                {isSelected && severity && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-1">
                      {(
                        ["mild", "moderate", "severe"] as SymptomSeverity[]
                      ).map((sev) => (
                        <button
                          key={sev}
                          onClick={() => setSeverity(type, sev)}
                          className={cn(
                            "flex-1 py-1 rounded-lg text-[10px] font-medium",
                            "border transition-colors",
                            severity === sev
                              ? SEVERITY_COLORS[sev]
                              : "border-slate-100 bg-white text-slate-400"
                          )}
                        >
                          {SEVERITY_LABELS[sev]}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Danger Warning */}
      <AnimatePresence>
        {hasSevereDanger && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 rounded-2xl 
                       bg-red-50 border border-red-200"
          >
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">
                علائم خطرناک شناسایی شد
              </p>
              <p className="text-xs text-red-600 mt-1 leading-relaxed">
                در صورت تنگی نفس یا درد قفسه سینه شدید، فوری با اورژانس 
                یا مرکز دیالیز تماس بگیرید.
              </p>
            </div>
          </motion.div>
        )}
        {hasDanger && !hasSevereDanger && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-3 rounded-xl 
                       bg-amber-50 border border-amber-200"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              علائم انتخابی را با تیم درمان در جلسه بعد در میان بگذارید.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes */}
      <div>
        <label className="text-xs text-slate-500 mb-2 block">
          توضیحات تکمیلی (اختیاری)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="هر توضیح اضافه‌ای درباره علائم خود بنویسید..."
          className="w-full rounded-xl border border-slate-200 p-3 text-sm 
                     text-slate-700 resize-none focus:outline-none 
                     focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
        />
      </div>

      {/* Submit */}
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="flex items-center justify-center gap-2 py-3 
                       rounded-xl bg-emerald-50 text-emerald-700"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">علائم ثبت شد ✓</span>
          </motion.div>
        ) : (
          <motion.button
            key="submit"
            onClick={handleSubmit}
            disabled={selected.size === 0 || createReport.isPending}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full py-3 rounded-xl font-medium text-sm transition-all",
              "flex items-center justify-center gap-2",
              selected.size > 0
                ? "bg-sky-500 hover:bg-sky-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
            {createReport.isPending
              ? "در حال ثبت..."
              : selected.size > 0
              ? `ثبت ${selected.size} علامت`
              : "یک علامت انتخاب کنید"}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}