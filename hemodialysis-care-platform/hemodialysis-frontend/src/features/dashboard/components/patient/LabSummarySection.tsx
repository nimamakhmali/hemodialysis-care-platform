// src/features/dashboard/components/patient/LabSummarySection.tsx
"use client";

import { motion } from "motion/react";
import { FlaskConical, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { formatPersianDate } from "@/lib/utils/date.utils";

interface LabEntry {
  value: number;
  unit: string;
  date: string;
  status: "normal" | "abnormal_low" | "abnormal_high" | "critical_low" | "critical_high";
}

const LAB_LABELS: Record<string, string> = {
  K: "پتاسیم",
  Na: "سدیم",
  Ca: "کلسیم",
  P: "فسفر",
  Hb: "هموگلوبین",
  Alb: "آلبومین",
  CRP: "CRP",
  Urea: "اوره",
  Cr: "کراتینین",
};

const STATUS_CONFIG = {
  normal: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
    label: "طبیعی",
  },
  abnormal_low: {
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700",
    label: "پایین",
  },
  abnormal_high: {
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700",
    label: "بالا",
  },
  critical_low: {
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700",
    label: "بحرانی پایین",
  },
  critical_high: {
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700",
    label: "بحرانی بالا",
  },
};

interface Props {
  labs: Record<string, LabEntry>;
  patientId: string;
}

export function LabSummarySection({ labs, patientId }: Props) {
  const entries = Object.entries(labs).slice(0, 6);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-violet-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            آخرین آزمایش‌ها
          </h3>
        </div>
        <Link
          href={`/clinician/patients/${patientId}/labs`}
          className="text-xs text-sky-600 hover:text-sky-700 
                     flex items-center gap-1 transition-colors"
        >
          مشاهده همه
          <ArrowLeft className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {entries.map(([code, entry], idx) => {
          const statusCfg = STATUS_CONFIG[entry.status];
          return (
            <motion.div
              key={code}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-xl border border-slate-100 p-3 
                         hover:border-slate-200 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">
                  {LAB_LABELS[code] ?? code}
                </span>
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    statusCfg.dot
                  )}
                />
              </div>
              <p className="text-lg font-bold text-slate-800 tabular-nums">
                {entry.value}
                <span className="text-xs font-normal text-slate-400 mr-1">
                  {entry.unit}
                </span>
              </p>
              <div className="flex items-center justify-between mt-2">
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                    statusCfg.badge
                  )}
                >
                  {statusCfg.label}
                </span>
                <span className="text-[10px] text-slate-300">
                  {formatPersianDate(entry.date)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}