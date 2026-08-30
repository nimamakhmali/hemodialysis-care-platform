// src/features/dashboard/components/clinician/RecentActivityFeed.tsx
"use client";

import { motion } from "motion/react";
import {
  Activity,
  FlaskConical,
  Thermometer,
  Droplets,
  Utensils,
  Bell,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import type { RecentActivity } from "../../types/clinician-dashboard.types";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/date.utils";
import { getSeverityColor } from "@/lib/utils/medical.utils";

const TYPE_CONFIG = {
  session: {
    icon: Activity,
    label: "جلسه دیالیز",
    color: "text-sky-600",
    bg: "bg-sky-50",
  },
  lab: {
    icon: FlaskConical,
    label: "آزمایش",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  symptom: {
    icon: Thermometer,
    label: "علائم",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  fluid: {
    icon: Droplets,
    label: "مایعات",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  diet: {
    icon: Utensils,
    label: "رژیم",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  alert: {
    icon: Bell,
    label: "هشدار",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  recommendation: {
    icon: Sparkles,
    label: "توصیه",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  message: {
    icon: MessageSquare,
    label: "پیام",
    color: "text-slate-600",
    bg: "bg-slate-50",
  },
} as const;

interface Props {
  activities: RecentActivity[];
}

export function RecentActivityFeed({ activities }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50">
        <h3 className="font-semibold text-slate-800">فعالیت‌های اخیر</h3>
      </div>

      {activities.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          فعالیتی ثبت نشده
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {activities.map((activity, idx) => {
            const config =
              TYPE_CONFIG[activity.type] ?? TYPE_CONFIG.session;
            const Icon = config.icon;
            const severityColors = activity.severity
              ? getSeverityColor(activity.severity)
              : null;

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="px-6 py-3.5 flex items-center gap-4"
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                    config.bg
                  )}
                >
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">
                      {activity.patient_name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {config.label}
                    </span>
                    {severityColors && (
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          severityColors.badge
                        )}
                      >
                        {activity.severity === "high"
                          ? "بحرانی"
                          : activity.severity === "medium"
                          ? "متوسط"
                          : "کم"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {activity.title}
                  </p>
                </div>
                <span className="text-xs text-slate-300 shrink-0">
                  {formatRelativeTime(activity.timestamp)}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}