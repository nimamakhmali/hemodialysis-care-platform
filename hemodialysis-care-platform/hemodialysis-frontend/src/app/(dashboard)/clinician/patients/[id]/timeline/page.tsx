"use client";

import { use } from "react";
import { motion } from "motion/react";
import { usePatientTimeline } from "@/features/patients/hooks/usePatients";
import { formatPersianDate, formatRelativeTime } from "@/lib/utils/date.utils";
import { pageVariants } from "@/lib/animation/variants";
import {
  Activity, Droplets, FlaskConical, Bell, MessageSquare,
  Utensils, Heart, BookOpen, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { TimelineEventType } from "@/features/patients/types/patient.types";

const TYPE_CONFIG: Record<
  TimelineEventType,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  session: { icon: Droplets, color: "text-primary-600", bg: "bg-primary-100", label: "جلسه دیالیز" },
  lab: { icon: FlaskConical, color: "text-cyan-600", bg: "bg-cyan-100", label: "آزمایش" },
  symptom: { icon: Heart, color: "text-rose-600", bg: "bg-rose-100", label: "علائم" },
  fluid: { icon: Droplets, color: "text-blue-600", bg: "bg-blue-100", label: "مایعات" },
  diet: { icon: Utensils, color: "text-green-600", bg: "bg-green-100", label: "رژیم غذایی" },
  alert: { icon: Bell, color: "text-amber-600", bg: "bg-amber-100", label: "هشدار" },
  message: { icon: MessageSquare, color: "text-violet-600", bg: "bg-violet-100", label: "پیام" },
  recommendation: { icon: BookOpen, color: "text-teal-600", bg: "bg-teal-100", label: "توصیه" },
};

export default function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: events, isLoading } = usePatientTimeline(id, 50);

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-3xl space-y-6 p-6"
    >
      <h2 className="text-base font-semibold text-slate-700">تایم‌لاین رویدادها</h2>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
                <div className="h-2 w-24 animate-pulse rounded bg-slate-50" />
              </div>
            </div>
          ))}
        </div>
      ) : !events?.length ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <Clock className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-400">رویدادی ثبت نشده است</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute right-[17px] top-0 bottom-0 w-px bg-gradient-to-b from-primary-200 via-primary-100 to-transparent" />

          <div className="space-y-4">
            {events.map((event, i) => {
              const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.session;
              return (
                <motion.div
                  key={event.id}
                  className="relative flex items-start gap-4"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.35 }}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ring-2 ring-white",
                      cfg.bg
                    )}
                  >
                    <cfg.icon className={cn("h-4 w-4", cfg.color)} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
                    <div className="mb-0.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            cfg.bg, cfg.color
                          )}
                        >
                          {cfg.label}
                        </span>
                        <h4 className="text-xs font-medium text-slate-700">
                          {event.title}
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(event.timestamp)}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-[11px] leading-relaxed text-slate-500">
                        {event.description}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-slate-300">
                      {formatPersianDate(event.timestamp)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}