"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/date.utils";
import { AlertSeverityIcon } from "./AlertSeverityIcon";
import { AlertBadge } from "./AlertBadge";
import { AlertActionButtons } from "./AlertActionButtons";
import type { Alert } from "../types/alert.types";

interface AlertCardProps {
  alert: Alert;
  index?: number;
}

function EvidenceItem({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono font-medium text-slate-700">{String(value)}</span>
    </div>
  );
}

const SEVERITY_BORDER: Record<string, string> = {
  high: "border-l-red-400",
  medium: "border-l-amber-400",
  low: "border-l-blue-300",
};

const STATUS_FA: Record<string, string> = {
  new: "جدید",
  acknowledged: "دیده‌شده",
  resolved: "بسته‌شده",
};

export function AlertCard({ alert, index = 0 }: AlertCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isResolved = alert.status === "resolved";

  return (
    <motion.div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white border-l-4 transition-all duration-200",
        SEVERITY_BORDER[alert.severity],
        isResolved ? "opacity-60" : "",
        alert.severity === "high" && !isResolved
          ? "shadow-[0_2px_16px_rgba(239,68,68,0.08)]"
          : "shadow-sm hover:shadow-md"
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      layout
    >
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <AlertSeverityIcon severity={alert.severity} size="sm" />

          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <AlertBadge severity={alert.severity} />
              {alert.category_fa && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {alert.category_fa}
                </span>
              )}
              <span className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-400">
                {STATUS_FA[alert.status] ?? alert.status}
              </span>
            </div>

            {/* Title */}
            <h4 className="text-sm font-semibold text-slate-800">{alert.title}</h4>

            {/* Patient + Time */}
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              {alert.patient_name && (
                <span className="font-medium text-slate-600">{alert.patient_name}</span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(alert.created_at)}
              </span>
            </div>
          </div>

          {/* Expand toggle */}
          <motion.button
            onClick={() => setIsExpanded((v) => !v)}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </motion.button>
        </div>

        {/* Actions */}
        {!isResolved && (
          <div className="mt-3 border-t border-slate-50 pt-3">
            <AlertActionButtons alert={alert} />
          </div>
        )}
      </div>

      {/* Expanded: explanation + evidence */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-4">
              {/* Explanation */}
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  توضیح بالینی
                </p>
                <p className="text-xs leading-relaxed text-slate-600">
                  {alert.clinician_explanation}
                </p>
              </div>

              {/* Evidence */}
              {Object.keys(alert.evidence).length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    داده‌های شواهد
                  </p>
                  <div className="space-y-1 rounded-xl border border-slate-100 bg-white p-3">
                    {Object.entries(alert.evidence).map(([k, v]) => (
                      <EvidenceItem key={k} label={k} value={v} />
                    ))}
                  </div>
                </div>
              )}

              {/* Rule name */}
              <p className="text-[10px] font-mono text-slate-300">
                Rule: {alert.triggered_by_rule}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}