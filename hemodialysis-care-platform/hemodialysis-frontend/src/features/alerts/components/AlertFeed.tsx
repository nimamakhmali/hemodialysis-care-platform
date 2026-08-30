// src/features/alerts/components/AlertFeed.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
} from "lucide-react";
import { useAlerts, useAcknowledgeAlert, useResolveAlert } from "../hooks/useAlerts";
import type { AlertFilters, Alert } from "../types/alert.types";
import type { AlertSeverity, AlertStatus } from "@/types/common.types";
import { cn } from "@/lib/utils/cn";
import { getSeverityColor, getSeverityLabel } from "@/lib/utils/medical.utils";
import { formatRelativeTime } from "@/lib/utils/date.utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { useRouter } from "next/navigation";

interface AlertCardProps {
  alert: Alert;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  isLoading?: boolean;
}

function AlertCard({ alert, onAcknowledge, onResolve, isLoading }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const colors = getSeverityColor(alert.severity);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border overflow-hidden transition-shadow",
        "hover:shadow-md",
        colors.border,
        alert.status === "resolved" && "opacity-60"
      )}
    >
      {/* Top bar */}
      <div className={cn("h-1", colors.dot.replace("bg-", "bg-"))} />

      <div className="bg-white p-5">
        {/* Header row */}
        <div className="flex items-start gap-4">
          {/* Severity dot */}
          <div
            className={cn(
              "mt-1 w-2.5 h-2.5 rounded-full shrink-0 ring-4",
              colors.dot,
              colors.ring
            )}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      colors.badge
                    )}
                  >
                    {getSeverityLabel(alert.severity)}
                  </span>
                  {alert.category_fa && (
                    <span className="text-xs text-slate-400 bg-slate-100 
                                     px-2 py-0.5 rounded-full">
                      {alert.category_fa}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {formatRelativeTime(alert.created_at)}
                  </span>
                </div>
                <h4 className="mt-2 text-sm font-semibold text-slate-800">
                  {alert.title}
                </h4>
                {alert.patient_name && (
                  <button
                    onClick={() =>
                      router.push(`/clinician/patients/${alert.patient_id}`)
                    }
                    className="text-xs text-sky-600 hover:text-sky-700 
                               flex items-center gap-1 mt-0.5"
                  >
                    {alert.patient_name}
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {alert.status === "new" && (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    disabled={isLoading}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 
                               hover:bg-sky-50 hover:text-sky-700 transition-colors 
                               text-slate-600 disabled:opacity-50"
                  >
                    تأیید دیدن
                  </button>
                )}
                {alert.status !== "resolved" && (
                  <button
                    onClick={() => onResolve(alert.id)}
                    disabled={isLoading}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 
                               hover:bg-emerald-50 hover:text-emerald-700 
                               transition-colors text-slate-600 disabled:opacity-50"
                  >
                    بستن
                  </button>
                )}
                <button
                  onClick={() => setExpanded((p) => !p)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  {expanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <p className="mt-3 text-sm text-slate-600 leading-relaxed mr-6">
          {alert.clinician_explanation}
        </p>

        {/* Expanded evidence */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 mr-6 p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-semibold text-slate-500 mb-3 
                              uppercase tracking-wide">
                  داده‌های مرتبط
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(alert.evidence).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <span className="text-slate-400">{key}: </span>
                      <span className="text-slate-700 font-medium">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-400">
                    قانون:{" "}
                    <span className="font-mono text-slate-600">
                      {alert.triggered_by_rule}
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface AlertFeedProps {
  patientId?: string;
}

export function AlertFeed({ patientId }: AlertFeedProps) {
  const [filters, setFilters] = useState<AlertFilters>({
    page: 1,
    size: 20,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useAlerts(
    patientId ? { ...filters, patient_id: patientId } : filters
  );
  const acknowledge = useAcknowledgeAlert();
  const resolve = useResolveAlert();

  const severities: Array<{ value: AlertSeverity | undefined; label: string }> =
    [
      { value: undefined, label: "همه" },
      { value: "high", label: "بحرانی" },
      { value: "medium", label: "متوسط" },
      { value: "low", label: "کم" },
    ];

  const statuses: Array<{ value: AlertStatus | undefined; label: string }> = [
    { value: undefined, label: "همه" },
    { value: "new", label: "جدید" },
    { value: "acknowledged", label: "دیده‌شده" },
    { value: "resolved", label: "بسته" },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {severities.map(({ value, label }) => (
            <button
              key={label}
              onClick={() => setFilters((f) => ({ ...f, severity: value, page: 1 }))}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
                filters.severity === value
                  ? "bg-sky-500 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {label}
            </button>
          ))}
          <div className="w-px h-4 bg-slate-200" />
          {statuses.map(({ value, label }) => (
            <button
              key={label}
              onClick={() => setFilters((f) => ({ ...f, status: value, page: 1 }))}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
                filters.status === value
                  ? "bg-slate-700 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {data?.stats && (
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>
              <span className="text-red-600 font-semibold">
                {data.stats.total_high}
              </span>{" "}
              بحرانی
            </span>
            <span>
              <span className="text-amber-600 font-semibold">
                {data.stats.total_medium}
              </span>{" "}
              متوسط
            </span>
            <span>
              <span className="text-sky-600 font-semibold">
                {data.stats.total_new}
              </span>{" "}
              جدید
            </span>
          </div>
        )}
      </div>

      {/* Alerts */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
          <Bell className="w-12 h-12 opacity-20" />
          <p>هشداری برای نمایش وجود ندارد</p>
        </div>
      ) : (
        <motion.div
          layout
          className="space-y-3"
        >
          {data?.data.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={(id) =>
                acknowledge.mutate({ alertId: id })
              }
              onResolve={(id) => resolve.mutate({ alertId: id })}
              isLoading={acknowledge.isPending || resolve.isPending}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}