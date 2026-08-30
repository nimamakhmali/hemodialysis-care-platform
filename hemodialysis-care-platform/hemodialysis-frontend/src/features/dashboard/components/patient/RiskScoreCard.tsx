// src/features/dashboard/components/patient/RiskScoreCard.tsx
"use client";

import { motion } from "motion/react";
import { ShieldAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

interface RiskData {
  score: number;
  level: "low" | "medium" | "high";
  interpretation_fa: string;
}

interface Props {
  risk: RiskData;
}

const LEVEL_CONFIG = {
  low: {
    label: "ریسک پایین",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    track: "#D1FAE5",
    fill: "#22C55E",
  },
  medium: {
    label: "ریسک متوسط",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    track: "#FEF3C7",
    fill: "#F59E0B",
  },
  high: {
    label: "ریسک بالا",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
    track: "#FEE2E2",
    fill: "#EF4444",
  },
};

export function RiskScoreCard({ risk }: Props) {
  const config = LEVEL_CONFIG[risk.level];
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (risk.score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className={cn(
        "rounded-2xl border bg-white p-5",
        config.border
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center",
            config.bg
          )}
        >
          <ShieldAlert className={cn("w-5 h-5", config.color)} />
        </div>
        <div>
          <p className="text-xs text-slate-500">امتیاز ریسک</p>
          <p className={cn("text-xs font-semibold", config.color)}>
            {config.label}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Gauge */}
        <div className="relative w-24 h-24 shrink-0">
          <svg
            className="w-full h-full -rotate-90"
            viewBox="0 0 80 80"
          >
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke={config.track}
              strokeWidth="7"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke={config.fill}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{
                duration: 1.5,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.3,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={cn("text-2xl font-bold tabular-nums", config.color)}
            >
              <AnimatedNumber value={risk.score} />
            </span>
            <span className="text-[10px] text-slate-400">/100</span>
          </div>
        </div>

        {/* Interpretation */}
        <div className="flex-1">
          <p className="text-xs text-slate-600 leading-relaxed">
            {risk.interpretation_fa}
          </p>
          <div
            className={cn(
              "mt-3 flex items-center gap-1.5 text-xs",
              config.color
            )}
          >
            <Info className="w-3.5 h-3.5" />
            <span>محاسبه‌شده توسط سیستم</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}