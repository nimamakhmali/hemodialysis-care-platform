// src/features/dashboard/components/clinician/StatsOverviewRow.tsx
"use client";

import { motion } from "motion/react";
import {
  Users,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  UserX,
} from "lucide-react";
import type { ClinicianDashboardStats } from "../../types/clinician-dashboard.types";
import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  sub?: string;
}

function StatCard({
  label,
  value,
  icon,
  colorClass,
  bgClass,
  borderClass,
  sub,
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5",
        "bg-white shadow-sm",
        borderClass
      )}
    >
      {/* Glow */}
      <div
        className={cn(
          "absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10",
          bgClass
        )}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className={cn("text-3xl font-bold tabular-nums", colorClass)}>
            {value}
          </p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={cn("p-3 rounded-xl", bgClass, "bg-opacity-20")}>
          <div className={colorClass}>{icon}</div>
        </div>
      </div>
    </motion.div>
  );
}

interface Props {
  stats: ClinicianDashboardStats;
}

export function StatsOverviewRow({ stats }: Props) {
  const cards: StatCardProps[] = [
    {
      label: "بیماران فعال",
      value: stats.active_patients,
      icon: <Users className="w-5 h-5" />,
      colorClass: "text-sky-600",
      bgClass: "bg-sky-100",
      borderClass: "border-sky-100",
      sub: `از ${stats.total_patients} بیمار`,
    },
    {
      label: "هشدارهای بحرانی",
      value: stats.active_alerts_high,
      icon: <AlertTriangle className="w-5 h-5" />,
      colorClass: "text-red-600",
      bgClass: "bg-red-100",
      borderClass: "border-red-100",
      sub:
        stats.active_alerts_medium > 0
          ? `${stats.active_alerts_medium} هشدار متوسط`
          : undefined,
    },
    {
      label: "توصیه در انتظار",
      value: stats.pending_recommendations,
      icon: <Clock className="w-5 h-5" />,
      colorClass: "text-amber-600",
      bgClass: "bg-amber-100",
      borderClass: "border-amber-100",
      sub: "نیاز به بررسی پزشک",
    },
    {
      label: "بیماران بی‌داده",
      value: stats.patients_with_no_recent_data,
      icon: <UserX className="w-5 h-5" />,
      colorClass: "text-slate-600",
      bgClass: "bg-slate-100",
      borderClass: "border-slate-100",
      sub: "بیش از ۷ روز",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <StatCard key={i} {...card} />
      ))}
    </div>
  );
}