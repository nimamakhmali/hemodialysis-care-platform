"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import { LabStatusIndicator } from "./LabStatusIndicator";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import type { LabResult } from "../types/lab.types";

interface LabResultCardProps {
  result: LabResult;
  index?: number;
  showRange?: boolean;
}

export function LabResultCard({
  result,
  index = 0,
  showRange = true,
}: LabResultCardProps) {
  const bgColor = result.is_critical
    ? "bg-red-50/60 border-red-200"
    : result.is_abnormal
    ? "bg-amber-50/60 border-amber-200"
    : "bg-white border-primary-100/60";

  return (
    <motion.div
      className={cn(
        "flex items-center justify-between rounded-xl border px-4 py-3",
        bgColor
      )}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div className="flex items-center gap-3">
        {/* Test code chip */}
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
          <span className="text-xs font-bold text-slate-600">{result.test_code}</span>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-700">{result.test_name_fa}</p>
          {showRange && result.ref_range_low != null && result.ref_range_high != null && (
            <p className="text-[10px] text-slate-400">
              مرجع: {result.ref_range_low} – {result.ref_range_high} {result.unit}
            </p>
          )}
          {result.note && (
            <p className="text-[10px] text-slate-400">{result.note}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className={cn(
          "text-base font-bold",
          result.is_critical ? "text-red-600"
          : result.is_abnormal ? "text-amber-600"
          : "text-slate-800"
        )}>
          <AnimatedNumber value={result.value} decimals={1} />
          <span className="ml-1 text-xs font-normal text-slate-400">{result.unit}</span>
        </span>
        <LabStatusIndicator
          isCritical={result.is_critical}
          isAbnormal={result.is_abnormal}
          direction={result.abnormality_direction}
        />
      </div>
    </motion.div>
  );
}