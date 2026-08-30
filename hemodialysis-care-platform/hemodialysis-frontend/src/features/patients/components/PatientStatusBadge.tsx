"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import type { AlertSeverity } from "@/types/common.types";

interface PatientStatusBadgeProps {
  severity?: AlertSeverity | null;
  isActive?: boolean;
  className?: string;
}

const CONFIG = {
  high: {
    label: "بحرانی",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 ring-1 ring-red-200",
    pulse: true,
  },
  medium: {
    label: "هشدار",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    pulse: false,
  },
  low: {
    label: "پایش",
    dot: "bg-blue-400",
    badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    pulse: false,
  },
  stable: {
    label: "پایدار",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    pulse: false,
  },
};

export function PatientStatusBadge({
  severity,
  isActive = true,
  className,
}: PatientStatusBadgeProps) {
  if (!isActive) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-500", className)}>
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        غیرفعال
      </span>
    );
  }

  const cfg = severity ? CONFIG[severity] : CONFIG.stable;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", cfg.badge, className)}>
      <motion.span
        className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)}
        animate={cfg.pulse ? { scale: [1, 1.5, 1], opacity: [1, 0.6, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      {cfg.label}
    </span>
  );
}