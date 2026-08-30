"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import type { AlertSeverity } from "@/types/common.types";

const LABELS: Record<AlertSeverity, string> = {
  high: "بحرانی",
  medium: "متوسط",
  low: "کم",
};

const STYLES: Record<AlertSeverity, string> = {
  high: "bg-red-50 text-red-700 ring-1 ring-red-200",
  medium: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  low: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
};

const DOT: Record<AlertSeverity, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-blue-400",
};

interface AlertBadgeProps {
  severity: AlertSeverity;
  label?: string;
  className?: string;
}

export function AlertBadge({ severity, label, className }: AlertBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        STYLES[severity],
        className
      )}
    >
      <motion.span
        className={cn("h-1.5 w-1.5 rounded-full", DOT[severity])}
        animate={severity === "high" ? { scale: [1, 1.4, 1], opacity: [1, 0.7, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      {label ?? LABELS[severity]}
    </span>
  );
}