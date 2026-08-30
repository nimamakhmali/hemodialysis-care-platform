"use client";

import { motion } from "motion/react";
import { Activity, Droplets, Heart, FlaskConical, Bell } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatPersianDate } from "@/lib/utils/date.utils";
import type { PatientDetail } from "../types/patient.types";

interface PatientSummaryCardProps {
  summary: PatientDetail["summary"];
  dryWeight: number;
  className?: string;
}

function MetricItem({
  icon: Icon,
  label,
  value,
  unit,
  status,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value?: number | string | null;
  unit?: string;
  status?: string;
  delay?: number;
}) {
  const statusColors: Record<string, string> = {
    normal: "text-emerald-600",
    abnormal_high: "text-amber-600",
    abnormal_low: "text-amber-600",
    critical_high: "text-red-600",
    critical_low: "text-red-600",
  };

  return (
    <motion.div
      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
          <Icon className="h-4 w-4 text-primary-500" />
        </div>
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <div className={cn("text-sm font-semibold", status ? statusColors[status] : "text-slate-800")}>
        {value != null ? (
          <>
            {typeof value === "number" ? (
              <AnimatedNumber value={value} decimals={1} />
            ) : (
              value
            )}
            {unit && <span className="ml-1 text-xs font-normal text-slate-400">{unit}</span>}
          </>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </div>
    </motion.div>
  );
}

export function PatientSummaryCard({
  summary,
  dryWeight,
  className,
}: PatientSummaryCardProps) {
  const lastSession = summary?.last_session;
  const labs = summary?.latest_labs;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Session Data */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          آخرین جلسه دیالیز
          {lastSession?.session_date && (
            <span className="mr-1.5 normal-case text-slate-300">
              — {formatPersianDate(lastSession.session_date)}
            </span>
          )}
        </p>
        <div className="space-y-2">
          <MetricItem
            icon={Droplets}
            label="وزن خشک"
            value={dryWeight}
            unit="kg"
            delay={0}
          />
          <MetricItem
            icon={Droplets}
            label="افزایش وزن بین جلسات"
            value={lastSession?.weight_gain}
            unit="kg"
            delay={0.05}
          />
          <MetricItem
            icon={Activity}
            label="IDWG"
            value={lastSession?.idwg_percent}
            unit="%"
            delay={0.1}
          />
          <MetricItem
            icon={Heart}
            label="فشار قبل دیالیز"
            value={
              lastSession?.bp_pre_systolic && lastSession?.bp_pre_diastolic
                ? `${lastSession.bp_pre_systolic}/${lastSession.bp_pre_diastolic}`
                : null
            }
            unit="mmHg"
            delay={0.15}
          />
        </div>
      </div>

      {/* Labs */}
      {labs && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            آخرین آزمایش‌ها
          </p>
          <div className="space-y-2">
            {labs.K && (
              <MetricItem
                icon={FlaskConical}
                label="پتاسیم (K)"
                value={labs.K.value}
                unit="mEq/L"
                status={labs.K.status}
                delay={0.2}
              />
            )}
            {labs.Hb && (
              <MetricItem
                icon={FlaskConical}
                label="هموگلوبین (Hb)"
                value={labs.Hb.value}
                unit="g/dL"
                status={labs.Hb.status}
                delay={0.25}
              />
            )}
            {labs.P && (
              <MetricItem
                icon={FlaskConical}
                label="فسفر (P)"
                value={labs.P.value}
                unit="mg/dL"
                status={labs.P.status}
                delay={0.3}
              />
            )}
            {labs.Alb && (
              <MetricItem
                icon={FlaskConical}
                label="آلبومین"
                value={labs.Alb.value}
                unit="g/dL"
                status={labs.Alb.status}
                delay={0.35}
              />
            )}
          </div>
        </div>
      )}

      {/* Alerts */}
      {summary?.active_alerts && summary.active_alerts.total > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            هشدارهای فعال
          </p>
          <div className="flex flex-wrap gap-2">
            {summary.active_alerts.high > 0 && (
              <motion.div
                className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Bell className="h-3 w-3" />
                {summary.active_alerts.high} بحرانی
              </motion.div>
            )}
            {summary.active_alerts.medium > 0 && (
              <motion.div
                className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600 ring-1 ring-amber-200"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, delay: 0.05 }}
              >
                <Bell className="h-3 w-3" />
                {summary.active_alerts.medium} متوسط
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}