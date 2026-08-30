"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, FlaskConical, ChevronDown, AlertTriangle } from "lucide-react";
import { useLabPanels, useLatestLabs, useCreateLabPanel } from "../hooks/useLabResults";
import { LabResultCard } from "./LabResultCard";
import { LabSummaryGrid } from "./LabSummaryGrid";
import { formatPersianDate } from "@/lib/utils/date.utils";
import { cn } from "@/lib/utils/cn";
import type { LabPanel } from "../types/lab.types";

interface PanelItemProps {
  panel: LabPanel;
  index: number;
}

function PanelItem({ panel, index }: PanelItemProps) {
  const [isOpen, setIsOpen] = useState(index === 0);

  return (
    <motion.div
      className="overflow-hidden rounded-2xl border border-primary-100/60 bg-white"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between p-4 text-right"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
            <FlaskConical className="h-4.5 w-4.5 text-primary-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {formatPersianDate(panel.collected_at)}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-[10px] text-slate-400">
                {panel.results.length} آزمایش
              </span>
              {panel.critical_count > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] font-medium text-red-500">
                  <AlertTriangle className="h-3 w-3" />
                  {panel.critical_count} بحرانی
                </span>
              )}
              {panel.abnormal_count > 0 && panel.critical_count === 0 && (
                <span className="text-[10px] font-medium text-amber-500">
                  {panel.abnormal_count} غیرطبیعی
                </span>
              )}
            </div>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t border-slate-100 bg-slate-50/40 p-4">
              {panel.results.map((result, i) => (
                <LabResultCard
                  key={result.id}
                  result={result}
                  index={i}
                  showRange
                />
              ))}
              {panel.notes && (
                <p className="mt-2 rounded-xl bg-white p-3 text-xs text-slate-600">
                  یادداشت: {panel.notes}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface LabHistoryTableProps {
  patientId: string;
}

export function LabHistoryTable({ patientId }: LabHistoryTableProps) {
  const [view, setView] = useState<"summary" | "history">("summary");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: panelsData, isLoading } = useLabPanels(patientId, page);
  const { data: latestLabs } = useLatestLabs(patientId);

  const VIEWS = [
    { id: "summary" as const, label: "خلاصه آخرین" },
    { id: "history" as const, label: "تاریخچه پنل‌ها" },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-primary-100 bg-white p-1">
          {VIEWS.map((v) => (
            <motion.button
              key={v.id}
              onClick={() => setView(v.id)}
              className={cn(
                "relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                view === v.id ? "text-primary-700" : "text-slate-500"
              )}
              whileTap={{ scale: 0.97 }}
            >
              {view === v.id && (
                <motion.div
                  className="absolute inset-0 rounded-lg bg-primary-50"
                  layoutId="lab-view"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative">{v.label}</span>
            </motion.button>
          ))}
        </div>

        <motion.button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary-500 px-3.5 py-2 text-xs font-medium text-white hover:bg-primary-600 shadow-sm"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus className="h-3.5 w-3.5" />
          پنل جدید
        </motion.button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {view === "summary" ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {latestLabs ? (
              <LabSummaryGrid
                latestLabs={latestLabs as Record<string, { value: number; is_abnormal?: boolean; is_critical?: boolean }>}
                patientId={patientId}
              />
            ) : (
              <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-primary-200 bg-primary-50/30">
                <p className="text-sm text-slate-400">آزمایشی ثبت نشده</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : !panelsData?.data.length ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary-200 bg-primary-50/30 py-12">
                <FlaskConical className="mb-3 h-8 w-8 text-primary-300" />
                <p className="text-sm text-slate-400">پنل آزمایشی ثبت نشده</p>
              </div>
            ) : (
              <>
                {panelsData.data.map((panel, i) => (
                  <PanelItem key={panel.id} panel={panel} index={i} />
                ))}
                {panelsData.pages > 1 && (
                  <div className="flex justify-center gap-2 pt-2">
                    {Array.from({ length: panelsData.pages }, (_, i) => i + 1).map((p) => (
                      <motion.button
                        key={p}
                        onClick={() => setPage(p)}
                        className={cn(
                          "h-8 w-8 rounded-lg text-xs font-medium",
                          page === p ? "bg-primary-500 text-white" : "border border-primary-100 text-slate-600"
                        )}
                        whileTap={{ scale: 0.95 }}
                      >
                        {p}
                      </motion.button>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}