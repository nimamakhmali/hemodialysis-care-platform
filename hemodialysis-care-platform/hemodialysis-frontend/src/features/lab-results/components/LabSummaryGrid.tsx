"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { useLabTrend } from "../hooks/useLabResults";
import { formatPersianDate } from "@/lib/utils/date.utils";
import type { LabTestCode } from "@/types/common.types";

const LAB_META: Partial<Record<LabTestCode, { nameFa: string; unit: string; normalLow: number; normalHigh: number }>> = {
  K: { nameFa: "پتاسیم", unit: "mEq/L", normalLow: 3.5, normalHigh: 5.0 },
  Na: { nameFa: "سدیم", unit: "mEq/L", normalLow: 135, normalHigh: 145 },
  Ca: { nameFa: "کلسیم", unit: "mg/dL", normalLow: 8.5, normalHigh: 10.5 },
  P: { nameFa: "فسفر", unit: "mg/dL", normalLow: 2.5, normalHigh: 4.5 },
  Hb: { nameFa: "هموگلوبین", unit: "g/dL", normalLow: 10, normalHigh: 12 },
  Alb: { nameFa: "آلبومین", unit: "g/dL", normalLow: 3.5, normalHigh: 5.0 },
  CRP: { nameFa: "CRP", unit: "mg/L", normalLow: 0, normalHigh: 5 },
  PTH: { nameFa: "PTH", unit: "pg/mL", normalLow: 150, normalHigh: 600 },
};

interface LabValueChipProps {
  code: LabTestCode;
  value: number;
  isAbnormal?: boolean;
  isCritical?: boolean;
  patientId: string;
  onClick: (code: LabTestCode) => void;
  isSelected: boolean;
}

function LabValueChip({
  code,
  value,
  isAbnormal,
  isCritical,
  onClick,
  isSelected,
}: LabValueChipProps) {
  const meta = LAB_META[code];
  const statusColor = isCritical
    ? "border-red-300 bg-red-50"
    : isAbnormal
    ? "border-amber-300 bg-amber-50"
    : "border-emerald-200 bg-emerald-50";

  return (
    <motion.button
      onClick={() => onClick(code)}
      className={cn(
        "relative rounded-xl border px-3 py-2.5 text-right transition-all",
        statusColor,
        isSelected && "ring-2 ring-primary-400 ring-offset-1"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <p className="text-[10px] text-slate-500">{meta?.nameFa ?? code}</p>
      <p className={cn(
        "text-base font-bold",
        isCritical ? "text-red-600" : isAbnormal ? "text-amber-600" : "text-emerald-700"
      )}>
        <AnimatedNumber value={value} decimals={1} />
        <span className="text-[10px] font-normal"> {meta?.unit ?? ""}</span>
      </p>
    </motion.button>
  );
}

function MiniTrendChart({ patientId, testCode }: { patientId: string; testCode: LabTestCode }) {
  const { data: trend, isLoading } = useLabTrend(patientId, testCode, 6);
  const meta = LAB_META[testCode];

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-xl bg-slate-100" />;
  }

  if (!trend?.history.length) return null;

  const chartData = trend.history.map((h) => ({
    date: h.date,
    value: h.value,
  }));

  const TrendIcon =
    trend.trend.direction === "increasing" ? TrendingUp
    : trend.trend.direction === "decreasing" ? TrendingDown
    : Minus;

  const trendColor =
    trend.trend.isConcerning ? "text-red-500"
    : trend.trend.direction === "decreasing" ? "text-emerald-500"
    : "text-slate-400";

  return (
    <motion.div
      className="rounded-2xl border border-primary-100 bg-white p-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-700">
            روند {meta?.nameFa ?? testCode}
          </span>
          <span className="mr-2 text-[10px] text-slate-400">
            ({trend.history.length} نمونه)
          </span>
        </div>
        <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span>{trend.trend.interpretationFa}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0F2FE" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "#94A3B8" }}
            tickFormatter={(v) => {
              try {
                return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(new Date(v));
              } catch { return v; }
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 9, fill: "#94A3B8" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-lg border border-primary-100 bg-white p-2 text-xs shadow">
                  <p className="text-slate-400">{label ? formatPersianDate(label) : ""}</p>
                  <p className="font-bold text-slate-800">
                    {Number(payload[0]?.value).toFixed(1)} {meta?.unit}
                  </p>
                </div>
              ) : null
            }
          />
          {meta && (
            <>
              <Line type="monotone" dataKey="value" stroke="#0EA5E9" strokeWidth={2}
                dot={{ r: 3, fill: "#0EA5E9", strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

interface LabSummaryGridProps {
  latestLabs: Record<string, { value: number; is_abnormal?: boolean; is_critical?: boolean }>;
  patientId: string;
}

export function LabSummaryGrid({ latestLabs, patientId }: LabSummaryGridProps) {
  const [selectedCode, setSelectedCode] = useState<LabTestCode | null>(null);

  const labEntries = Object.entries(latestLabs).filter(
    ([, v]) => v?.value != null
  );

  if (!labEntries.length) {
    return (
      <div className="rounded-2xl border border-dashed border-primary-200 bg-primary-50/30 py-10 text-center">
        <p className="text-sm text-slate-400">آزمایشی ثبت نشده است</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {labEntries.map(([code, data]) => (
          <LabValueChip
            key={code}
            code={code as LabTestCode}
            value={data.value}
            isAbnormal={data.is_abnormal}
            isCritical={data.is_critical}
            patientId={patientId}
            onClick={(c) => setSelectedCode((prev) => (prev === c ? null : c))}
            isSelected={selectedCode === code}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedCode && (
          <MiniTrendChart patientId={patientId} testCode={selectedCode} />
        )}
      </AnimatePresence>
    </div>
  );
}