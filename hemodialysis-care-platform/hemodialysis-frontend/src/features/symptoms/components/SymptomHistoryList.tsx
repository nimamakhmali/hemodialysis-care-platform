// src/features/symptoms/components/SymptomHistoryList.tsx
"use client";

import { motion } from "motion/react";
import { useSymptomHistory } from "../hooks/useSymptoms";
import {
  SYMPTOM_LABELS,
  SYMPTOM_EMOJIS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
} from "../types/symptom.types";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPersianDate } from "@/lib/utils/date.utils";
import { cn } from "@/lib/utils/cn";

interface Props {
  patientId: string;
}

export function SymptomHistoryList({ patientId }: Props) {
  const { data, isLoading } = useSymptomHistory(patientId, { days: 14 });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-10 text-center text-slate-400 text-sm">
        علائمی در ۱۴ روز گذشته ثبت نشده
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((report, idx) => (
        <motion.div
          key={report.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="rounded-2xl border border-slate-100 bg-white p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-slate-600">
              {formatPersianDate(report.reported_at)}
            </p>
            <span className="text-xs text-slate-400">
              {report.symptoms.length} علامت
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {report.symptoms.map((s) => (
              <div
                key={s.type}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full",
                  "border text-xs font-medium",
                  SEVERITY_COLORS[s.severity]
                )}
              >
                <span>{SYMPTOM_EMOJIS[s.type]}</span>
                <span>{SYMPTOM_LABELS[s.type]}</span>
                <span className="opacity-70">
                  — {SEVERITY_LABELS[s.severity]}
                </span>
              </div>
            ))}
          </div>

          {report.notes && (
            <p className="mt-2 text-xs text-slate-500 bg-slate-50 
                          rounded-lg p-2 leading-relaxed">
              {report.notes}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}