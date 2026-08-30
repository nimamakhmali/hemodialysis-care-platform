// src/features/admin/components/AdminDashboardView.tsx
"use client";

import { motion } from "motion/react";
import {
  Users, Activity, Bell, BookOpen,
  Database, Server, Cpu, FileText,
  AlertTriangle, CheckCircle, XCircle,
  TrendingUp,
} from "lucide-react";
import { useSystemHealth, useSystemStats } from "../hooks/useAdmin";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Skeleton } from "@/components/ui/Skeleton";
import { staggerContainer, fadeInUp } from "@/lib/animation/variants";
import { cn } from "@/lib/utils/cn";

// ─── System Health Widget ────────────────────────────────────────────────────
function ServiceStatus({
  label,
  status,
  icon: Icon,
}: {
  label: string;
  status: "ok" | "error" | "unknown";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const cfg = {
    ok: {
      dot: "bg-emerald-500",
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      label: "سالم",
    },
    error: {
      dot: "bg-red-500",
      text: "text-red-600",
      bg: "bg-red-50",
      label: "خطا",
    },
    unknown: {
      dot: "bg-slate-400",
      text: "text-slate-500",
      bg: "bg-slate-50",
      label: "نامعلوم",
    },
  }[status];

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-2xl border",
        status === "ok"
          ? "border-emerald-100"
          : status === "error"
          ? "border-red-100"
          : "border-slate-100"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          cfg.bg
        )}
      >
        <Icon className={cn("w-5 h-5", cfg.text)} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <motion.div
            className={cn("w-2 h-2 rounded-full", cfg.dot)}
            animate={
              status === "ok"
                ? { scale: [1, 1.2, 1] }
                : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className={cn("text-xs font-medium", cfg.text)}>
            {cfg.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function SystemHealthWidget() {
  const { data, isLoading } = useSystemHealth();

  if (isLoading) return <Skeleton className="h-48 rounded-2xl" />;

  const overallOk =
    data?.database === "ok" &&
    data?.redis === "ok";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center",
              overallOk ? "bg-emerald-50" : "bg-red-50"
            )}
          >
            {overallOk ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              وضعیت سیستم
            </h3>
            <p
              className={cn(
                "text-xs",
                overallOk ? "text-emerald-600" : "text-red-600"
              )}
            >
              {overallOk ? "همه سرویس‌ها سالم" : "مشکل در سرویس‌ها"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <ServiceStatus
          label="دیتابیس"
          status={data?.database ?? "unknown"}
          icon={Database}
        />
        <ServiceStatus
          label="Redis"
          status={data?.redis ?? "unknown"}
          icon={Server}
        />
        <ServiceStatus
          label="Celery"
          status={data?.celery ?? "unknown"}
          icon={Cpu}
        />
      </div>
    </div>
  );
}

// ─── Stats Card ──────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
}

function StatsCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  bg,
  border,
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white p-5",
        border
      )}
    >
      <div
        className={cn(
          "absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10",
          bg
        )}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 mb-1">{label}</p>
          <p className={cn("text-3xl font-bold tabular-nums", color)}>
            <AnimatedNumber value={value} />
          </p>
          {sub && (
            <p className="text-xs text-slate-400 mt-1">{sub}</p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", bg, "bg-opacity-20")}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export function AdminDashboardView() {
  const { data: stats, isLoading: statsLoading } = useSystemStats();

  const statCards: StatCardProps[] = [
    {
      label: "کل کاربران",
      value: stats?.total_users ?? 0,
      icon: Users,
      color: "text-sky-600",
      bg: "bg-sky-100",
      border: "border-sky-100",
      sub: `${stats?.total_clinicians ?? 0} کلینیسین`,
    },
    {
      label: "بیماران",
      value: stats?.total_patients ?? 0,
      icon: Activity,
      color: "text-violet-600",
      bg: "bg-violet-100",
      border: "border-violet-100",
    },
    {
      label: "هشدارهای فعال",
      value: stats?.active_alerts ?? 0,
      icon: Bell,
      color: "text-red-600",
      bg: "bg-red-100",
      border: "border-red-100",
      sub: `امروز: ${stats?.alerts_today ?? 0}`,
    },
    {
      label: "توصیه در انتظار",
      value: stats?.pending_recommendations ?? 0,
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-100",
      border: "border-amber-100",
    },
    {
      label: "جلسات دیالیز",
      value: stats?.total_sessions ?? 0,
      icon: Activity,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
      border: "border-emerald-100",
      sub: `امروز: ${stats?.sessions_today ?? 0}`,
    },
    {
      label: "پنل‌های آزمایش",
      value: stats?.total_lab_panels ?? 0,
      icon: FileText,
      color: "text-cyan-600",
      bg: "bg-cyan-100",
      border: "border-cyan-100",
    },
  ];

  return (
    <motion.div
      variants={staggerContainer(0.07)}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={fadeInUp}>
        <PageHeader
          title="داشبورد مدیریت"
          description="آمار کلی سیستم و وضعیت سرویس‌ها"
          icon={<Server className="w-5 h-5" />}
        />
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        {statsLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))
          : statCards.map((card, i) => (
              <StatsCard key={i} {...card} />
            ))}
      </motion.div>

      {/* System Health */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <SystemHealthWidget />

        {/* Quick links */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">
            دسترسی سریع
          </h3>
          <div className="space-y-2">
            {[
              {
                label: "مدیریت کاربران",
                href: "/admin/users",
                icon: Users,
                color: "text-sky-600",
                bg: "bg-sky-50",
              },
              {
                label: "محتوای آموزشی",
                href: "/admin/education",
                icon: BookOpen,
                color: "text-violet-600",
                bg: "bg-violet-50",
              },
              {
                label: "گزارش فعالیت",
                href: "/admin/audit-logs",
                icon: FileText,
                color: "text-slate-600",
                bg: "bg-slate-50",
              },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-xl 
                           hover:bg-slate-50 transition-colors group"
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center",
                    item.bg
                  )}
                >
                  <item.icon className={cn("w-5 h-5", item.color)} />
                </div>
                <span className="text-sm text-slate-700 font-medium flex-1">
                  {item.label}
                </span>
                <span className="text-slate-300 group-hover:text-slate-500 transition-colors">
                  ←
                </span>
              </a>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}