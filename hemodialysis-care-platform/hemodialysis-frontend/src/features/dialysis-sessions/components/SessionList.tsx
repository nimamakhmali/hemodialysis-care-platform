"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Droplets } from "lucide-react";
import { useSessions, useWeightTrend, useBPTrend } from "../hooks/useSessions";
import { SessionCard } from "./SessionCard";
import { WeightTrendChart } from "./WeightTrendChart";
import { BPTrendChart } from "./BPTrendChart";
import { SessionForm } from "./SessionForm";

interface SessionListProps {
  patientId: string;
  dryWeight: number;
}

function SessionListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-primary-100/60 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-32 rounded bg-slate-200" />
              <div className="h-2.5 w-20 rounded bg-slate-100" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-12 rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SessionList({ patientId, dryWeight }: SessionListProps) {
  const [activeView, setActiveView] = useState<"list" | "weight" | "bp">("list");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSessions(patientId, { page, size: 10 });
  const { data: weightTrend } = useWeightTrend(patientId, 8);
  const { data: bpTrend } = useBPTrend(patientId, 8);

  const VIEWS = [
    { id: "list" as const, label: "لیست جلسات" },
    { id: "weight" as const, label: "روند وزن" },
    { id: "bp" as const, label: "روند فشار خون" },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* View tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-primary-100 bg-white p-1">
          {VIEWS.map((v) => (
            <motion.button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeView === v.id
                  ? "text-primary-700"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              whileTap={{ scale: 0.97 }}
            >
              {activeView === v.id && (
                <motion.div
                  className="absolute inset-0 rounded-lg bg-primary-50"
                  layoutId="session-view-bg"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative">{v.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Add button */}
        <motion.button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary-500 px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-primary-600 transition-colors"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus className="h-3.5 w-3.5" />
          جلسه جدید
        </motion.button>
      </div>

      {/* Session Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <SessionForm
            patientId={patientId}
            dryWeight={dryWeight}
            onClose={() => setIsFormOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeView === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {isLoading ? (
              <SessionListSkeleton />
            ) : !data?.data.length ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary-200 bg-primary-50/30 py-16">
                <motion.div
                  className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Droplets className="h-6 w-6 text-primary-400" />
                </motion.div>
                <p className="text-sm text-slate-500">جلسه‌ای ثبت نشده است</p>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="mt-3 text-xs font-medium text-primary-500 hover:text-primary-700"
                >
                  ثبت اولین جلسه
                </button>
              </div>
            ) : (
              <>
                {data.data.map((s, i) => (
                  <SessionCard key={s.id} session={s} index={i} />
                ))}

                {/* Pagination */}
                {data.pages > 1 && (
                  <div className="flex justify-center gap-2 pt-2">
                    {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                      <motion.button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`h-8 w-8 rounded-lg text-xs font-medium transition-all ${
                          page === p
                            ? "bg-primary-500 text-white"
                            : "border border-primary-100 text-slate-600 hover:border-primary-300"
                        }`}
                        whileHover={{ scale: 1.05 }}
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

        {activeView === "weight" && (
          <motion.div
            key="weight"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {weightTrend ? (
              <WeightTrendChart trend={weightTrend} dryWeight={dryWeight} />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-primary-200 bg-primary-50/30">
                <p className="text-sm text-slate-400">داده کافی برای نمودار وجود ندارد</p>
              </div>
            )}
          </motion.div>
        )}

        {activeView === "bp" && (
          <motion.div
            key="bp"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {bpTrend ? (
              <BPTrendChart trend={bpTrend} />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-primary-200 bg-primary-50/30">
                <p className="text-sm text-slate-400">داده فشار خون کافی وجود ندارد</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}