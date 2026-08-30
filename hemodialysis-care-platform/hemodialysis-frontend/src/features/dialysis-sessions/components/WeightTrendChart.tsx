"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Droplets } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatPersianDate } from "@/lib/utils/date.utils";
import type { WeightTrend } from "../types/session.types";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-primary-100 bg-white p-3 shadow-lg">
      <p className="mb-2 text-xs font-medium text-slate-500">
        {label ? formatPersianDate(label) : ""}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="font-semibold text-slate-800">
            {entry.value?.toFixed(1)} kg
          </span>
        </div>
      ))}
    </div>
  );
}

interface WeightTrendChartProps {
  trend: WeightTrend;
  dryWeight: number;
}

export function WeightTrendChart({ trend, dryWeight }: WeightTrendChartProps) {
  const chartData = useMemo(
    () =>
      trend.sessions.map((s) => ({
        date: s.date,
        "وزن قبل": s.pre_weight,
        "وزن بعد": s.post_weight,
        "وزن خشک": s.dry_weight,
        idwg: s.idwg_percent,
      })),
    [trend.sessions]
  );

  const trendIcon =
    trend.trend === "increasing" ? TrendingUp
    : trend.trend === "decreasing" ? TrendingDown
    : Minus;

  const trendColor =
    trend.concerning ? "text-red-500"
    : trend.trend === "decreasing" ? "text-emerald-500"
    : "text-slate-400";

  if (!chartData.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-primary-200 bg-primary-50/30">
        <p className="text-sm text-slate-400">داده کافی برای نمایش روند وجود ندارد</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "میانگین IDWG",
            value: trend.average_idwg_percent,
            suffix: "%",
            warning: trend.average_idwg_percent > 3,
          },
          {
            label: "آخرین وزن قبل",
            value: trend.sessions.at(-1)?.pre_weight,
            suffix: " kg",
            warning: false,
          },
          {
            label: "روند",
            isCustom: true,
            icon: trendIcon,
            color: trendColor,
            label2:
              trend.trend === "increasing" ? "صعودی"
              : trend.trend === "decreasing" ? "نزولی"
              : "پایدار",
            warning: trend.concerning,
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            className={cn(
              "rounded-xl border p-3 text-center",
              "item" in item && (item as { warning?: boolean }).warning
                ? "border-amber-200 bg-amber-50"
                : "border-primary-100 bg-primary-50/50"
            )}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            {"isCustom" in item && item.isCustom ? (
              <div className={cn("flex flex-col items-center gap-1", item.color)}>
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label2}</span>
                <span className="text-[10px] text-slate-400">{item.label}</span>
              </div>
            ) : (
              <>
                <p className="text-base font-bold text-slate-800">
                  {item.value != null ? (
                    <>
                      <AnimatedNumber value={item.value} decimals={1} />
                      <span className="text-xs font-normal">{item.suffix}</span>
                    </>
                  ) : "—"}
                </p>
                <p className="text-[10px] text-slate-500">{item.label}</p>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div
        className="rounded-2xl border border-primary-100/60 bg-white p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-3 flex items-center gap-2">
          <Droplets className="h-4 w-4 text-primary-500" />
          <span className="text-xs font-semibold text-slate-600">روند وزن</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="weightPre" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="weightPost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E0F2FE"
              vertical={false}
            />
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
              domain={["auto", "auto"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={dryWeight}
              stroke="#14B8A6"
              strokeDasharray="4 4"
              label={{
                value: "وزن خشک",
                position: "right",
                fontSize: 9,
                fill: "#14B8A6",
              }}
            />
            <Area
              type="monotone"
              dataKey="وزن قبل"
              stroke="#0EA5E9"
              strokeWidth={2}
              fill="url(#weightPre)"
              dot={{ r: 3, fill: "#0EA5E9", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            <Area
              type="monotone"
              dataKey="وزن بعد"
              stroke="#06B6D4"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="url(#weightPost)"
              dot={{ r: 2, fill: "#06B6D4", strokeWidth: 0 }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}