"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown, Droplets, Heart, Clock,
  AlertTriangle, CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPersianDate } from "@/lib/utils/date.utils";
import { SessionEventBadge } from "./SessionEventBadge";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import type { DialysisSession } from "../types/session.types";
import type { SessionEvent } from "@/types/common.types";

interface SessionCardProps {
  session: DialysisSession;
  index?: number;
}

function BPDisplay({
  systolic,
  diastolic,
  label,
}: {
  systolic?: number | null;
  diastolic?: number | null;
  label: string;
}) {
  if (!systolic) return null;
  return (
    <div className="text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-700">
        {systolic}/{diastolic ?? "—"}
      </p>
    </div>
  );
}

function IDWGIndicator({ percent }: { percent?: number | null }) {
  if (percent == null) return null;

  const status =
    percent >= 5 ? "critical"
    : percent >= 3 ? "warning"
    : "ok";

  const config = {
    critical: { color: "text-red-600", bg: "bg-red-50", label: "بحرانی" },
    warning: { color: "text-amber-600", bg: "bg-amber-50", label: "هشدار" },
    ok: { color: "text-emerald-600", bg: "bg-emerald-50", label: "طبیعی" },
  }[status];

  return (
    <div className={cn("rounded-xl px-3 py-2 text-center", config.bg)}>
      <p className={cn("text-sm font-bold", config.color)}>
        <AnimatedNumber value={percent} decimals={1} />%
      </p>
      <p className="text-[10px] text-slate-500">IDWG</p>
    </div>
  );
}

export function SessionCard({ session, index = 0 }: SessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasEvents = (session.intradialytic_events?.length ?? 0) > 0;
  const hasIDH = session.had_intradialytic_hypotension;

  return (
    <motion.div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white transition-shadow duration-200",
        hasIDH
          ? "border-red-200 shadow-[0_2px_12px_rgba(239,68,68,0.07)]"
          : hasEvents
          ? "border-amber-200"
          : "border-primary-100/60",
        "hover:shadow-md"
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      layout
    >
      {/* Header */}
      <div
        className="cursor-pointer p-4"
        onClick={() => setIsExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Date + Status */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-primary-50">
              <Droplets className="h-4 w-4 text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {formatPersianDate(session.session_date)}
              </p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                {session.duration_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {session.duration_minutes} دقیقه
                  </span>
                )}
                {hasIDH && (
                  <span className="flex items-center gap-1 text-red-500">
                    <AlertTriangle className="h-3 w-3" />
                    افت فشار حین دیالیز
                  </span>
                )}
                {!hasIDH && !hasEvents && (
                  <span className="flex items-center gap-1 text-emerald-500">
                    <CheckCircle className="h-3 w-3" />
                    بدون رخداد
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Weight + BP + Expand */}
          <div className="flex items-center gap-3">
            <IDWGIndicator percent={session.weight_gain_percent} />
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-400"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.div>
          </div>
        </div>

        {/* Quick metrics */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-slate-50 p-2 text-center">
            <p className="text-xs text-slate-400">وزن قبل</p>
            <p className="text-sm font-bold text-slate-700">
              {session.pre_weight.toFixed(1)}
              <span className="text-[10px] font-normal"> kg</span>
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2 text-center">
            <p className="text-xs text-slate-400">وزن بعد</p>
            <p className="text-sm font-bold text-slate-600">
              {session.post_weight?.toFixed(1) ?? "—"}
              <span className="text-[10px] font-normal"> kg</span>
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-2 text-center">
            <p className="text-xs text-slate-400">فشار قبل</p>
            <p className="text-sm font-bold text-slate-700">
              {session.bp_pre_systolic
                ? `${session.bp_pre_systolic}/${session.bp_pre_diastolic}`
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 p-4">
              {/* BP Table */}
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  فشار خون
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <BPDisplay
                    systolic={session.bp_pre_systolic}
                    diastolic={session.bp_pre_diastolic}
                    label="قبل"
                  />
                  <BPDisplay
                    systolic={session.bp_during_systolic}
                    diastolic={session.bp_during_diastolic}
                    label="حین"
                  />
                  <BPDisplay
                    systolic={session.bp_post_systolic}
                    diastolic={session.bp_post_diastolic}
                    label="بعد"
                  />
                </div>
                {session.bp_drop_during != null && session.bp_drop_during > 0 && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    افت فشار حین دیالیز:{" "}
                    <span className={cn("font-medium", session.bp_drop_during >= 20 ? "text-red-600" : "text-amber-600")}>
                      {session.bp_drop_during.toFixed(0)} mmHg
                    </span>
                  </p>
                )}
              </div>

              {/* UF Volume */}
              {session.uf_volume != null && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    حجم UF
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {session.uf_volume.toFixed(2)} لیتر
                  </p>
                </div>
              )}

              {/* Events */}
              {hasEvents && (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    رخدادهای حین دیالیز
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {session.intradialytic_events!.map((ev) => (
                      <SessionEventBadge key={ev} event={ev as SessionEvent} />
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {session.notes && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    یادداشت
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600">
                    {session.notes}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}