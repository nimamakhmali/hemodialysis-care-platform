"use client";

import { motion, AnimatePresence } from "motion/react";
import { Users } from "lucide-react";
import { PatientCard } from "./PatientCard";
import type { PatientSummary } from "../types/patient.types";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

interface PatientListProps {
  patients: PatientSummary[];
  isLoading: boolean;
  totalCount?: number;
}

// ── Skeleton ──────────────────────────────────
export function PatientCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-primary-100/60 bg-white p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-slate-200" />
        <div className="flex-1">
          <div className="mb-2 h-4 w-32 rounded-lg bg-slate-200" />
          <div className="h-3 w-20 rounded-lg bg-slate-100" />
        </div>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="h-px bg-slate-100" />
      <div className="mt-3 flex justify-between">
        <div className="h-3 w-24 rounded bg-slate-100" />
        <div className="h-3 w-20 rounded bg-slate-100" />
      </div>
    </div>
  );
}

export function PatientList({
  patients,
  isLoading,
  totalCount,
}: PatientListProps) {
  // ── Loading State ─────────────────────────
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <PatientCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // ── Empty State ───────────────────────────
  if (patients.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary-200 bg-primary-50/50 py-20"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Users className="h-8 w-8 text-primary-400" />
        </motion.div>
        <h3 className="mb-1 text-base font-semibold text-slate-700">
          بیماری یافت نشد
        </h3>
        <p className="text-sm text-slate-400">
          معیارهای جستجو یا فیلتر را تغییر دهید
        </p>
      </motion.div>
    );
  }

  // ── List ──────────────────────────────────
  return (
    <div>
      {/* Count */}
      {totalCount !== undefined && (
        <motion.p
          className="mb-4 text-sm text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatedNumber
            value={totalCount}
            className="font-semibold text-slate-700"
          />
          &nbsp;بیمار یافت شد
        </motion.p>
      )}

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          layout
        >
          {patients.map((patient, index) => (
            <PatientCard key={patient.id} patient={patient} index={index} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Re-export for convenience
export { PatientCardSkeleton as PatientCardSkeletonItem };