// src/features/dashboard/components/patient/WeightStatusCard.tsx
"use client";

import { motion } from "motion/react";
import { Scale, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatPersianDate } from "@/lib/utils/date.utils";

interface WeightSummary {
  last_pre_weight?: number | null;
  dry_weight: number;
  weight_gain?: number | null;
  idwg_percent?: number | null;
  status: "ok" | "warning" | "critical";
  trend: "stable" | "increasing" | "decreasing";
  last_session_date?: string | null;
}

interface Props {
  summary: WeightSummary;
}

const STATUS_CONFIG = {
  ok: {
    label: "طبیعی",
    bar: "bg-emerald-500",
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    msg: "وزن شما در محدوده مناسب است. 👍",
  },
  warning: {
    label: "هشدار",
    bar: "bg-amber-500",
    text: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    msg: "وزن شما کمی بیشتر از حد معمول است. مصرف مایعات را کنترل کنید.",
  },
  critical: {
    label: "بحرانی",
    bar: "bg-red-500",
    text: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
    msg: "وزن شما به‌طور قابل توجهی بالاست. با تیم درمان تماس بگیرید.",
  },
};

const TREND_ICON = {
  increasing: TrendingUp,
  decreasing: TrendingDown,
  stable: Minus,
};

export function WeightStatusCard({ summary }: Props) {
  const config = STATUS_CONFIG[summary.status];
  const TrendIcon = TREND_ICON[summary.trend];

  // Progress: idwg_percent نسبت به سقف ۵٪
  const progressPct = Math.min(
    ((summary.idwg_percent ?? 0) / 5) * 100,
    100
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border bg-white p-5 space-y-4",
        config.border
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center",
              config.bg
            )}
          >
            <Scale className={cn("w-5 h-5", config.text)} />
          </div>
          <div>
            <p className="text-xs text-slate-500">وضعیت وزن</p>
            <p className={cn("text-xs font-semibold", config.text)}>
              {config.label}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
            config.bg,
            config.text
          )}
        >
          <TrendIcon className="w-3 h-3" />
          <span>
            {summary.trend === "increasing"
              ? "افزایشی"
              : summary.trend === "decreasing"
              ? "کاهشی"
              : "ثابت"}
          </span>
        </div>
      </div>

      {/* Main values */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">وزن فعلی</p>
          <p className="text-xl font-bold text-slate-800">
            {summary.last_pre_weight != null ? (
              <>
                <AnimatedNumber
                  value={summary.last_pre_weight}
                  decimals={1}
                />
                <span className="text-xs font-normal text-slate-400"> kg</span>
              </>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </p>
        </div>

        <div className="text-center border-x border-slate-100">
          <p className="text-xs text-slate-400 mb-1">وزن خشک</p>
          <p className="text-xl font-bold text-sky-600">
            <AnimatedNumber value={summary.dry_weight} decimals={1} />
            <span className="text-xs font-normal text-slate-400"> kg</span>
          </p>
        </div>

        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">اضافه وزن</p>
          <p
            className={cn(
              "text-xl font-bold",
              (summary.weight_gain ?? 0) > 0 ? config.text : "text-slate-400"
            )}
          >
            {summary.weight_gain != null ? (
              <>
                +<AnimatedNumber value={summary.weight_gain} decimals={1} />
                <span className="text-xs font-normal text-slate-400"> kg</span>
              </>
            ) : (
              "—"
            )}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {summary.idwg_percent != null && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>درصد افزایش وزن</span>
            <span className={cn("font-semibold", config.text)}>
              {summary.idwg_percent.toFixed(1)}٪
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", config.bar)}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-300">
            <span>۰٪</span>
            <span>۳٪ هشدار</span>
            <span>۵٪ بحرانی</span>
          </div>
        </div>
      )}

      {/* Message */}
      <div
        className={cn(
          "rounded-xl p-3 text-xs leading-relaxed",
          config.bg,
          config.text
        )}
      >
        {config.msg}
      </div>

      {summary.last_session_date && (
        <p className="text-[11px] text-slate-400 text-center">
          آخرین جلسه: {formatPersianDate(summary.last_session_date)}
        </p>
      )}
    </motion.div>
  );
}