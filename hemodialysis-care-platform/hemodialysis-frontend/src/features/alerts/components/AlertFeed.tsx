"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Filter, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAlerts } from "../hooks/useAlerts";
import { AlertCard } from "./AlertCard";
import type { AlertSeverity, AlertStatus } from "@/types/common.types";

type SeverityFilter = AlertSeverity | "all";
type StatusFilter = AlertStatus | "all";

const SEVERITY_OPTS: { value: SeverityFilter; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "high", label: "بحرانی" },
  { value: "medium", label: "متوسط" },
  { value: "low", label: "کم" },
];

const STATUS_OPTS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "new", label: "جدید" },
  { value: "acknowledged", label: "دیده‌شده" },
  { value: "resolved", label: "بسته" },
];

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-primary-400 bg-primary-50 text-primary-700"
          : "border-slate-200 bg-white text-slate-500 hover:border-primary-200"
      )}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {label}
    </motion.button>
  );
}

interface AlertFeedProps {
  patientId?: string;
  className?: string;
}

export function AlertFeed({ patientId, className }: AlertFeedProps) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("new");

  const { data, isLoading, isError, refetch, isFetching } = useAlerts({
    severity: severityFilter === "all" ? undefined : severityFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const alerts = data?.data ?? [];
  const stats = data?.stats;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4.5 w-4.5 text-primary-500" />
          <h3 className="text-sm font-semibold text-slate-700">
            هشدارهای بالینی
          </h3>
          {stats && stats.total_new > 0 && (
            <motion.span
              className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {stats.total_new}
            </motion.span>
          )}
        </div>

        <motion.button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 rounded-xl border border-primary-100 px-3 py-1.5 text-xs text-slate-500 hover:border-primary-200 hover:text-primary-600 transition-colors"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.div animate={{ rotate: isFetching ? 360 : 0 }} transition={{ duration: 1, repeat: isFetching ? Infinity : 0, ease: "linear" }}>
            <RefreshCw className="h-3 w-3" />
          </motion.div>
          به‌روزرسانی
        </motion.button>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {SEVERITY_OPTS.map((opt) => (
            <FilterPill
              key={opt.value}
              label={opt.label}
              active={severityFilter === opt.value}
              onClick={() => setSeverityFilter(opt.value)}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTS.map((opt) => (
            <FilterPill
              key={opt.value}
              label={opt.label}
              active={statusFilter === opt.value}
              onClick={() => setStatusFilter(opt.value)}
            />
          ))}
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <motion.div
          className="grid grid-cols-3 gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[
            { label: "بحرانی", count: stats.total_high, color: "text-red-600 bg-red-50 ring-red-200" },
            { label: "متوسط", count: stats.total_medium, color: "text-amber-600 bg-amber-50 ring-amber-200" },
            { label: "کم", count: stats.total_low, color: "text-blue-600 bg-blue-50 ring-blue-200" },
          ].map((s) => (
            <div
              key={s.label}
              className={cn("flex items-center justify-between rounded-xl px-3 py-2 ring-1", s.color)}
            >
              <span className="text-xs font-medium">{s.label}</span>
              <span className="text-sm font-bold">{s.count}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">خطا در دریافت هشدارها</p>
        </div>
      ) : alerts.length === 0 ? (
        <motion.div
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Bell className="h-6 w-6 text-emerald-500" />
          </motion.div>
          <p className="text-sm text-slate-500">هشداری در این فیلتر وجود ندارد</p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <AlertCard key={alert.id} alert={alert} index={i} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}