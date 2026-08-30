// src/features/dashboard/components/patient/BPStatusCard.tsx
"use client";

import { motion } from "motion/react";
import { Heart, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatBP } from "@/lib/utils/medical.utils";

interface BPSummary {
  last_pre_systolic?: number | null;
  last_pre_diastolic?: number | null;
  last_post_systolic?: number | null;
  last_post_diastolic?: number | null;
  trend: "stable" | "increasing" | "decreasing";
  status: "ok" | "warning" | "critical";
}

const STATUS_CONFIG = {
  ok: {
    label: "طبیعی",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    msg: "فشار خون شما در محدوده مناسب است.",
  },
  warning: {
    label: "هشدار",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    msg: "فشار خون شما از حد معمول خارج شده. با تیم درمان مشورت کنید.",
  },
  critical: {
    label: "بحرانی",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
    msg: "فشار خون شما در وضعیت بحرانی است. فوری تماس بگیرید.",
  },
};

const TREND_ICON = {
  increasing: TrendingUp,
  decreasing: TrendingDown,
  stable: Minus,
};

interface Props {
  summary: BPSummary;
}

export function BPStatusCard({ summary }: Props) {
  const config = STATUS_CONFIG[summary.status];
  const TrendIcon = TREND_ICON[summary.trend];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
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
            <Heart className={cn("w-5 h-5", config.color)} />
          </div>
          <div>
            <p className="text-xs text-slate-500">فشار خون</p>
            <p className={cn("text-xs font-semibold", config.color)}>
              {config.label}
            </p>
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
            config.bg,
            config.color
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

      {/* BP Values */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className={cn(
            "rounded-xl p-3 text-center",
            config.bg
          )}
        >
          <p className="text-xs text-slate-500 mb-1">قبل از دیالیز</p>
          <p className={cn("text-2xl font-bold tabular-nums", config.color)}>
            {formatBP(summary.last_pre_systolic, summary.last_pre_diastolic)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">mmHg</p>
        </div>

        <div className="rounded-xl p-3 text-center bg-slate-50">
          <p className="text-xs text-slate-500 mb-1">بعد از دیالیز</p>
          <p className="text-2xl font-bold tabular-nums text-slate-600">
            {formatBP(
              summary.last_post_systolic,
              summary.last_post_diastolic
            )}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">mmHg</p>
        </div>
      </div>

      {/* Message */}
      <div
        className={cn(
          "rounded-xl p-3 text-xs leading-relaxed",
          config.bg,
          config.color
        )}
      >
        {config.msg}
      </div>
    </motion.div>
  );
}