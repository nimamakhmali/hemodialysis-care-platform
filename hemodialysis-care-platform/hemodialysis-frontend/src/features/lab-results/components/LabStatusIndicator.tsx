"use client";

import { cn } from "@/lib/utils/cn";

type LabStatus = "normal" | "abnormal_high" | "abnormal_low" | "critical_high" | "critical_low";

const STATUS_CONFIG: Record<LabStatus, { label: string; dot: string; badge: string }> = {
  normal: { label: "طبیعی", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  abnormal_high: { label: "بالا", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  abnormal_low: { label: "پایین", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  critical_high: { label: "بحرانی بالا", dot: "bg-red-500", badge: "bg-red-50 text-red-700 ring-red-200" },
  critical_low: { label: "بحرانی پایین", dot: "bg-red-500", badge: "bg-red-50 text-red-700 ring-red-200" },
};

interface LabStatusIndicatorProps {
  isCritical: boolean;
  isAbnormal: boolean;
  direction?: "high" | "low" | null;
  className?: string;
}

export function LabStatusIndicator({
  isCritical,
  isAbnormal,
  direction,
  className,
}: LabStatusIndicatorProps) {
  let status: LabStatus = "normal";
  if (isCritical) status = direction === "high" ? "critical_high" : "critical_low";
  else if (isAbnormal) status = direction === "high" ? "abnormal_high" : "abnormal_low";

  const cfg = STATUS_CONFIG[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1", cfg.badge, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}