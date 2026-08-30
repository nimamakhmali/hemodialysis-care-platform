// src/features/fluid-diet/components/FluidPageView.tsx
"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Droplets, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  useLogFluid,
  useTodayFluid,
  useFluidHistory,
} from "../hooks/useFluidLog";
import {
  QUICK_FLUID_ITEMS,
  type FluidItem,
} from "../types/fluid-diet.types";
import { cn } from "@/lib/utils/cn";
import { todayISO, formatPersianDate } from "@/lib/utils/date.utils";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  patientId: string;
}

export function FluidPageView({ patientId }: Props) {
  const [items, setItems] = useState<FluidItem[]>([]);
  const [customAmount, setCustomAmount] = useState("");

  const { data: todayLog, isLoading: todayLoading } = useTodayFluid(patientId);
  const { data: history } = useFluidHistory(patientId, { days: 7 });
  const logFluid = useLogFluid(patientId);

  const todayTotal = todayLog?.total_ml ?? 0;
  const sessionTotal = items.reduce((s, i) => s + i.amount_ml, 0);
  const grandTotal = todayTotal + sessionTotal;

  function addQuick(item: (typeof QUICK_FLUID_ITEMS)[number]) {
    setItems((prev) => [
      ...prev,
      { type: item.type, amount_ml: item.amount_ml, label: item.label },
    ]);
  }

  function addCustom() {
    const ml = parseInt(customAmount, 10);
    if (!ml || ml <= 0 || ml > 2000) return;
    setItems((prev) => [
      ...prev,
      { type: "custom", amount_ml: ml, label: "سفارشی" },
    ]);
    setCustomAmount("");
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (grandTotal === 0) return;
    await logFluid.mutateAsync({
      log_date: todayISO(),
      total_ml: grandTotal,
      items: [
        ...(todayLog?.items ?? []),
        ...items,
      ],
    });
    setItems([]);
  }

  // Progress (max reference 1500ml as rough guide, not medical threshold)
  const progressPct = Math.min((grandTotal / 1500) * 100, 100);
  const progressColor =
    grandTotal > 1200
      ? "bg-red-400"
      : grandTotal > 800
      ? "bg-amber-400"
      : "bg-sky-400";

  return (
    <div className="space-y-6">
      <PageHeader
        title="پایش مایعات"
        description="مصرف مایعات امروز را ثبت کنید"
        icon={<Droplets className="w-5 h-5" />}
      />

      {/* Today Progress */}
      <div className="rounded-2xl border border-sky-100 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500">مصرف امروز</p>
            {todayLoading ? (
              <Skeleton className="h-9 w-28 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-sky-600 tabular-nums">
                <AnimatedNumber value={grandTotal} />
                <span className="text-base font-normal text-slate-400"> ml</span>
              </p>
            )}
          </div>

          <div className="w-14 h-14 rounded-full border-4 border-sky-100 
                          flex items-center justify-center">
            <Droplets className="w-6 h-6 text-sky-500" />
          </div>
        </div>

        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full transition-colors", progressColor)}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <p className="text-xs text-slate-400 mt-2">
          مقدار توصیه‌شده توسط پزشک را رعایت کنید
        </p>
      </div>

      {/* Quick Add */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">
          اضافه کردن سریع
        </h3>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {QUICK_FLUID_ITEMS.map((item) => (
            <motion.button
              key={item.type}
              onClick={() => addQuick(item)}
              whileTap={{ scale: 0.96 }}
              className="rounded-xl border border-slate-100 bg-slate-50 
                         hover:bg-sky-50 hover:border-sky-200 
                         transition-colors p-3 text-center"
            >
              <div className="text-xl mb-1">{item.emoji}</div>
              <p className="text-xs text-slate-600 font-medium">
                {item.label}
              </p>
              <p className="text-[10px] text-slate-400">
                {item.amount_ml} ml
              </p>
            </motion.button>
          ))}
        </div>

        {/* Custom input */}
        <div className="flex gap-2">
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="مقدار دلخواه (ml)"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 
                       text-sm focus:outline-none focus:ring-2 
                       focus:ring-sky-500/30 focus:border-sky-400"
          />
          <button
            onClick={addCustom}
            className="px-4 py-2.5 rounded-xl bg-sky-500 text-white 
                       hover:bg-sky-600 transition-colors flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">اضافه</span>
          </button>
        </div>
      </div>

      {/* Current Session Items */}
      {items.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800">
              ثبت‌نشده ({sessionTotal} ml)
            </h3>
          </div>

          <div className="space-y-2 mb-4">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 
                           rounded-xl bg-sky-50 border border-sky-100"
              >
                <span className="text-sm text-slate-700">
                  {item.label ?? item.type}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-sky-600">
                    {item.amount_ml} ml
                  </span>
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={logFluid.isPending}
            className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 
                       text-white font-medium text-sm transition-colors 
                       disabled:opacity-60"
          >
            {logFluid.isPending ? "در حال ثبت..." : "ثبت مصرف مایعات"}
          </button>
        </div>
      )}

      {/* History */}
      {history && history.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">
            ۷ روز گذشته
          </h3>
          <div className="space-y-2">
            {history.slice(0, 7).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-2 
                           border-b border-slate-50 last:border-0"
              >
                <span className="text-sm text-slate-600">
                  {formatPersianDate(log.log_date)}
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    log.total_ml > 1200
                      ? "text-red-500"
                      : log.total_ml > 800
                      ? "text-amber-500"
                      : "text-emerald-600"
                  )}
                >
                  {log.total_ml} ml
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}