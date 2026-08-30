"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Heart } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { cn } from "@/lib/utils/cn";
import type { BPTrend } from "../types/session.types";

interface BPTrendChartProps {
  trend: BPTrend;
}

function BPTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-primary-100 bg-white p-3 shadow-lg">
      <p className="mb-2 text-xs font-medium text-slate-500">
        {label ? new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(new Date(label)) : ""}
      </p>
      {payload.map((e) => (
        <div key={e.name} className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
            {e.name}
          </span>
          <span className="font-semibold text-slate-800">{e.value} mmHg</span>
        </div>
      ))}
    </div>
  );
}

export function BPTrendChart({ trend }: BPTrendChartProps) {
  const chartData = useMemo(
    () =>
      trend.sessions.map((s) => ({
        date: s.date,
        "سیستولیک قبل": s.pre.systolic,
        "دیاستولیک قبل": s.pre.diastolic,
        "حین دیالیز": s.during.systolic,
      })),
    [trend.sessions]
  );

  const avgSys = trend.average_pre_systolic;
  const bpStatus =
    avgSys > 160 ? "high"
    : avgSys > 140 ? "elevated"
    : avgSys < 100 ? "low"
    : "normal";

  const bpStatusConfig = {
    high: { label: "فشار بالا", color: "text-red-600", bg: "bg-red-50 border-red-200" },
    elevated: { label: "کمی بالا", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
    low: { label: "فشار پایین", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    normal: { label: "طبیعی", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  }[bpStatus];

  if (!chartData.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-primary-200 bg-primary-50/30">
        <p className="text-sm text-slate-400">داده فشار خون کافی وجود ندارد</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          className={cn("rounded-xl border p-3 text-center", bpStatusConfig.bg)}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className={cn("text-base font-bold", bpStatusConfig.color)}>
            <AnimatedNumber value={avgSys} />
            <span className="text-xs font-normal"> mmHg</span>
          </p>
          <p className="text-[10px] text-slate-500">میانگین سیستولیک</p>
          <p className={cn("text-[10px] font-medium mt-0.5", bpStatusConfig.color)}>
            {bpStatusConfig.label}
          </p>
        </motion.div>

        <motion.div
          className="rounded-xl border border-primary-100 bg-primary-50/50 p-3 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 }}
        >
          <p className="text-base font-bold text-slate-700">
            {trend.trend === "increasing" ? "صعودی 📈"
            : trend.trend === "decreasing" ? "نزولی 📉"
            : "پایدار ➡️"}
          </p>
          <p className="text-[10px] text-slate-500">روند کلی</p>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div
        className="rounded-2xl border border-primary-100/60 bg-white p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div className="mb-3 flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-400" />
          <span className="text-xs font-semibold text-slate-600">روند فشار خون</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0F2FE" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#94A3B8" }}
              tickFormatter={(v) => {
                try {
                  return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(new Date(v));
                } catch { return v; }
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94A3B8" }}
              axisLine={false}
              tickLine={false}
              domain={[60, 200]}
            />
            <Tooltip content={<BPTooltip />} />
            {/* Normal range */}
            <ReferenceLine y={140} stroke="#F59E0B" strokeDasharray="3 3" strokeOpacity={0.5} />
            <ReferenceLine y={90} stroke="#F59E0B" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Line
              type="monotone"
              dataKey="سیستولیک قبل"
              stroke="#0EA5E9"
              strokeWidth={2}
              dot={{ r: 3, fill: "#0EA5E9", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="دیاستولیک قبل"
              stroke="#06B6D4"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={{ r: 2, fill: "#06B6D4", strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="حین دیالیز"
              stroke="#F87171"
              strokeWidth={1.5}
              dot={{ r: 2, fill: "#F87171", strokeWidth: 0 }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}