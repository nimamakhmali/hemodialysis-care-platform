// src/features/patients/components/PatientTimeline.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  FlaskConical,
  Thermometer,
  Droplets,
  Utensils,
  Bell,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { QUERY_KEYS } from "@/lib/query/queryClient";
import type { TimelineEvent } from "../types/patient.types";
import { cn } from "@/lib/utils/cn";
import { formatPersianDate, formatPersianDateTime } from "@/lib/utils/date.utils";
import { getSeverityColor } from "@/lib/utils/medical.utils";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AlertSeverity } from "@/types/common.types";

// ─── Event Type Config ──────────────────────────────────────────────────────
const EVENT_CONFIG = {
  session: {
    icon: Activity,
    label: "جلسه دیالیز",
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-100",
    dot: "bg-sky-400",
  },
  lab: {
    icon: FlaskConical,
    label: "آزمایش",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    dot: "bg-violet-400",
  },
  symptom: {
    icon: Thermometer,
    label: "علائم",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    dot: "bg-rose-400",
  },
  fluid: {
    icon: Droplets,
    label: "مایعات",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-100",
    dot: "bg-cyan-400",
  },
  diet: {
    icon: Utensils,
    label: "رژیم",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    dot: "bg-emerald-400",
  },
  alert: {
    icon: Bell,
    label: "هشدار",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    dot: "bg-amber-400",
  },
  message: {
    icon: MessageSquare,
    label: "پیام",
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-100",
    dot: "bg-slate-400",
  },
  recommendation: {
    icon: Sparkles,
    label: "توصیه",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    dot: "bg-amber-400",
  },
} as const;

// ─── Hook ───────────────────────────────────────────────────────────────────
function usePatientTimeline(patientId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.patientTimeline(patientId),
    queryFn: async (): Promise<TimelineEvent[]> => {
      const res = await apiClient.get(
        API_ENDPOINTS.patients.timeline(patientId)
      );
      return res.data?.data ?? res.data ?? [];
    },
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Event Card ──────────────────────────────────────────────────────────────
function TimelineEventCard({
  event,
  isLast,
}: {
  event: TimelineEvent;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const config =
    EVENT_CONFIG[event.type as keyof typeof EVENT_CONFIG] ??
    EVENT_CONFIG.session;
  const Icon = config.icon;

  const severityColors =
    event.severity ? getSeverityColor(event.severity as AlertSeverity) : null;

  const hasMetadata =
    event.metadata && Object.keys(event.metadata).length > 0;

  return (
    <div className="flex gap-4">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
            "border-2 border-white shadow-sm",
            config.bg
          )}
        >
          <Icon className={cn("w-4 h-4", config.color)} />
        </motion.div>
        {!isLast && (
          <div className="w-px flex-1 mt-2 bg-gradient-to-b from-slate-200 to-transparent min-h-[32px]" />
        )}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "flex-1 mb-6 rounded-2xl border bg-white overflow-hidden",
          "hover:shadow-sm transition-shadow",
          event.severity
            ? (severityColors?.border ?? "border-slate-100")
            : "border-slate-100"
        )}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    config.bg,
                    config.color
                  )}
                >
                  {config.label}
                </span>

                {event.severity && severityColors && (
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      severityColors.badge
                    )}
                  >
                    {event.severity === "high"
                      ? "بحرانی"
                      : event.severity === "medium"
                      ? "متوسط"
                      : "کم"}
                  </span>
                )}

                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatPersianDateTime(event.timestamp)}
                </span>
              </div>

              <h4 className="mt-1.5 text-sm font-semibold text-slate-800">
                {event.title}
              </h4>

              {event.description && (
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  {event.description}
                </p>
              )}
            </div>

            {/* Expand button */}
            {hasMetadata && (
              <button
                onClick={() => setExpanded((p) => !p)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              >
                {expanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
            )}
          </div>

          {/* Metadata */}
          <AnimatePresence>
            {expanded && hasMetadata && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(event.metadata ?? {}).map(([k, v]) => (
                      <div key={k} className="text-xs">
                        <span className="text-slate-400">{k}: </span>
                        <span className="text-slate-700 font-medium">
                          {String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Day Group ──────────────────────────────────────────────────────────────
function DayGroup({
  date,
  events,
}: {
  date: string;
  events: TimelineEvent[];
}) {
  return (
    <div>
      {/* Date separator */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-xs font-medium text-slate-400 bg-white px-3 py-1 
                         rounded-full border border-slate-100">
          {formatPersianDate(date)}
        </span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      {/* Events */}
      {events.map((event, idx) => (
        <TimelineEventCard
          key={event.id}
          event={event}
          isLast={idx === events.length - 1}
        />
      ))}
    </div>
  );
}

// ─── Filter Types ─────────────────────────────────────────────────────────
type FilterType = "all" | TimelineEvent["type"];

const FILTER_OPTIONS: Array<{ value: FilterType; label: string }> = [
  { value: "all", label: "همه" },
  { value: "session", label: "جلسات" },
  { value: "lab", label: "آزمایش‌ها" },
  { value: "symptom", label: "علائم" },
  { value: "alert", label: "هشدارها" },
  { value: "fluid", label: "مایعات" },
  { value: "diet", label: "رژیم" },
  { value: "recommendation", label: "توصیه‌ها" },
];

// ─── Main Component ─────────────────────────────────────────────────────────
export function PatientTimeline({ patientId }: { patientId: string }) {
  const { data, isLoading, isError } = usePatientTimeline(patientId);
  const [filter, setFilter] = useState<FilterType>("all");

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
            <Skeleton className="flex-1 h-20 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-16 text-center text-slate-400">
        <p>خطا در بارگذاری تایم‌لاین</p>
      </div>
    );
  }

  // Filter
  const filtered =
    filter === "all"
      ? (data ?? [])
      : (data ?? []).filter((e) => e.type === filter);

  // Group by day
  const grouped = filtered.reduce<Record<string, TimelineEvent[]>>(
    (acc, event) => {
      const day = event.timestamp.split("T")[0];
      if (!acc[day]) acc[day] = [];
      acc[day].push(event);
      return acc;
    },
    {}
  );

  const sortedDays = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0",
              filter === value
                ? "bg-sky-500 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Empty */}
      {sortedDays.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
          <Activity className="w-12 h-12 opacity-20" />
          <p className="text-sm">رویدادی برای نمایش وجود ندارد</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {sortedDays.map((day) => (
            <DayGroup key={day} date={day} events={grouped[day]} />
          ))}
        </motion.div>
      )}
    </div>
  );
}