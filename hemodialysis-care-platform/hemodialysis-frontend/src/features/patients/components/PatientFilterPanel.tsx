"use client";

import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { PatientFilters } from "../types/patient.types";

interface FilterOption {
  value: string;
  label: string;
}

const STATUS_OPTIONS: FilterOption[] = [
  { value: "all", label: "همه بیماران" },
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
];

const SORT_OPTIONS: FilterOption[] = [
  { value: "name", label: "نام" },
  { value: "last_session", label: "آخرین جلسه" },
  { value: "risk_score", label: "امتیاز ریسک" },
  { value: "alert_count", label: "تعداد هشدار" },
];

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
        active
          ? "border-primary-400 bg-primary-50 text-primary-700"
          : "border-slate-200 bg-white text-slate-600 hover:border-primary-200"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {label}
    </motion.button>
  );
}

interface PatientFilterPanelProps {
  isOpen: boolean;
  filters: PatientFilters;
  onFiltersChange: (filters: PatientFilters) => void;
  onClose: () => void;
  onReset: () => void;
}

export function PatientFilterPanel({
  isOpen,
  filters,
  onFiltersChange,
  onClose,
  onReset,
}: PatientFilterPanelProps) {
  const hasActiveFilters =
    (filters.status && filters.status !== "all") ||
    filters.has_active_alerts ||
    filters.no_recent_data ||
    Boolean(filters.sort_by);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-lg"
          initial={{ opacity: 0, height: 0, y: -10 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">فیلترها</h3>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <motion.button
                    onClick={onReset}
                    className="text-xs text-primary-500 hover:text-primary-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    پاک کردن همه
                  </motion.button>
                )}
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-slate-500">وضعیت</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <FilterChip
                    key={opt.value}
                    label={opt.label}
                    active={
                      (filters.status ?? "all") === opt.value
                    }
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        status: opt.value as PatientFilters["status"],
                      })
                    }
                  />
                ))}
              </div>
            </div>

            {/* Quick Filters */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-slate-500">
                فیلتر سریع
              </p>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="دارای هشدار فعال"
                  active={Boolean(filters.has_active_alerts)}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      has_active_alerts: !filters.has_active_alerts,
                    })
                  }
                />
                <FilterChip
                  label="بدون داده اخیر"
                  active={Boolean(filters.no_recent_data)}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      no_recent_data: !filters.no_recent_data,
                    })
                  }
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">
                مرتب‌سازی بر اساس
              </p>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <FilterChip
                    key={opt.value}
                    label={opt.label}
                    active={filters.sort_by === opt.value}
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        sort_by: opt.value as PatientFilters["sort_by"],
                        sort_order:
                          filters.sort_by === opt.value &&
                          filters.sort_order === "desc"
                            ? "asc"
                            : "desc",
                      })
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}