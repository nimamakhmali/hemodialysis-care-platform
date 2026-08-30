// src/features/fluid-diet/components/DietPageView.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Utensils, CheckCircle, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLogDiet, useDietHistory } from "../hooks/useDietLog";
import {
  DIET_ADHERENCE_LABELS,
  DIET_ADHERENCE_COLORS,
  DIET_ADHERENCE_DOT,
  type DietAdherence,
} from "../types/fluid-diet.types";
import { cn } from "@/lib/utils/cn";
import { todayISO, formatPersianDate } from "@/lib/utils/date.utils";

interface Props {
  patientId: string;
}

type DietKey =
  | "potassium_adherence"
  | "phosphorus_adherence"
  | "protein_adherence"
  | "sodium_adherence";

const DIET_QUESTIONS: Array<{
  key: DietKey;
  label: string;
  emoji: string;
  hint: string;
}> = [
  {
    key: "potassium_adherence",
    label: "محدودیت پتاسیم",
    emoji: "🍌",
    hint: "موز، گوجه، سیب‌زمینی، پرتقال",
  },
  {
    key: "phosphorus_adherence",
    label: "محدودیت فسفر",
    emoji: "🥛",
    hint: "لبنیات، آجیل، حبوبات",
  },
  {
    key: "protein_adherence",
    label: "مصرف پروتئین کافی",
    emoji: "🥩",
    hint: "گوشت، مرغ، ماهی، تخم‌مرغ",
  },
  {
    key: "sodium_adherence",
    label: "محدودیت نمک",
    emoji: "🧂",
    hint: "غذاهای شور، کنسرو، فست فود",
  },
];

const ADHERENCE_OPTIONS: DietAdherence[] = ["good", "moderate", "poor"];

export function DietPageView({ patientId }: Props) {
  const [form, setForm] = useState<Record<DietKey, DietAdherence>>({
    potassium_adherence: "good",
    phosphorus_adherence: "good",
    protein_adherence: "good",
    sodium_adherence: "good",
  });
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const logDiet = useLogDiet(patientId);
  const { data: history } = useDietHistory(patientId, { days: 7 });

  async function handleSubmit() {
    await logDiet.mutateAsync({
      log_date: todayISO(),
      ...form,
      notes: notes.trim() || undefined,
    });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="رژیم غذایی"
        description="وضعیت رعایت رژیم امروز را ثبت کنید"
        icon={<Utensils className="w-5 h-5" />}
      />

      <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-slate-800 mb-1">
            رژیم امروز چطور بود؟
          </h2>
          <p className="text-sm text-slate-500">
            برای هر مورد گزینه مناسب را انتخاب کنید
          </p>
        </div>

        <div className="space-y-5">
          {DIET_QUESTIONS.map((q) => (
            <div key={q.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{q.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {q.label}
                  </p>
                  <p className="text-xs text-slate-400">{q.hint}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {ADHERENCE_OPTIONS.map((opt) => {
                  const isSelected = form[q.key] === opt;
                  return (
                    <motion.button
                      key={opt}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, [q.key]: opt }))
                      }
                      whileTap={{ scale: 0.97 }}
                      className={cn(
                        "py-3 rounded-xl border-2 text-sm font-medium transition-all",
                        isSelected
                          ? DIET_ADHERENCE_COLORS[opt]
                          : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      {isSelected && (
                        <CheckCircle className="w-3.5 h-3.5 inline ml-1" />
                      )}
                      {DIET_ADHERENCE_LABELS[opt]}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-slate-500 mb-2 block">
            توضیحات (اختیاری)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="اگر نکته‌ای درباره رژیم امروز دارید بنویسید..."
            className="w-full rounded-xl border border-slate-200 p-3 text-sm 
                       resize-none focus:outline-none focus:ring-2 
                       focus:ring-sky-500/30 focus:border-sky-400"
          />
        </div>

        {/* Submit */}
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 py-3 
                         rounded-xl bg-emerald-50 text-emerald-700"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">رژیم ثبت شد ✓</span>
            </motion.div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={logDiet.isPending}
              className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 
                         text-white font-medium text-sm transition-colors 
                         disabled:opacity-60"
            >
              {logDiet.isPending ? "در حال ثبت..." : "ثبت وضعیت رژیم"}
            </button>
          )}
        </AnimatePresence>
      </div>

      {/* History */}
      <button
        onClick={() => setShowHistory((p) => !p)}
        className="w-full flex items-center justify-center gap-2 py-3 
                   rounded-2xl border border-slate-200 bg-white 
                   text-slate-600 text-sm hover:bg-slate-50 transition-colors"
      >
        تاریخچه رژیم
        <motion.div
          animate={{ rotate: showHistory ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {showHistory && history && history.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-3">
              {history.map((log) => (
                <div
                  key={log.id}
                  className="space-y-2 pb-3 border-b border-slate-50 last:border-0 last:pb-0"
                >
                  <p className="text-xs font-medium text-slate-500">
                    {formatPersianDate(log.log_date)}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {DIET_QUESTIONS.map((q) => {
                      const val = log[q.key];
                      return (
                        <div
                          key={q.key}
                          className="flex items-center gap-2"
                        >
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              DIET_ADHERENCE_DOT[val]
                            )}
                          />
                          <span className="text-xs text-slate-600">
                            {q.label}:{" "}
                            <span className="font-medium">
                              {DIET_ADHERENCE_LABELS[val]}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}