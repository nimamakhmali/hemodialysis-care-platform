"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { UserPlus, Users, AlertTriangle, Activity } from "lucide-react";
import { usePatients } from "@/features/patients/hooks/usePatients";
import { PatientSearchBar } from "@/features/patients/components/PatientSearchBar";
import { PatientFilterPanel } from "@/features/patients/components/PatientFilterPanel";
import { PatientList } from "@/features/patients/components/PatientList";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { pageVariants, staggerContainer, cardVariants } from "@/lib/animation/variants";
import type { PatientFilters } from "@/features/patients/types/patient.types";

const DEFAULT_FILTERS: PatientFilters = {
  status: "all",
  sort_by: "last_session",
  sort_order: "desc",
};

// ── Quick Stats Header ────────────────────────
function QuickStats({
  data,
}: {
  data?: { total: number; high_alerts: number; avg_risk: number } | null;
}) {
  const stats = [
    {
      label: "کل بیماران",
      value: data?.total ?? 0,
      icon: Users,
      color: "text-primary-600",
      bg: "bg-primary-50",
    },
    {
      label: "هشدار بحرانی",
      value: data?.high_alerts ?? 0,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "میانگین ریسک",
      value: data?.avg_risk ?? 0,
      icon: Activity,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-3 gap-3"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={cardVariants}
          className="flex items-center gap-3 rounded-2xl border border-primary-100/60 bg-white p-4"
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">
              <AnimatedNumber value={stat.value} />
            </p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────
export default function PatientsPage() {
  const [filters, setFilters] = useState<PatientFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, isLoading, isError } = usePatients(filters, page, 12);

  const handleSearchChange = useCallback(
    (search: string) => {
      setFilters((prev) => ({ ...prev, search }));
      setPage(1);
    },
    []
  );

  const handleFiltersChange = useCallback((newFilters: PatientFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const hasActiveFilters =
    Boolean(filters.search) ||
    (filters.status && filters.status !== "all") ||
    Boolean(filters.has_active_alerts) ||
    Boolean(filters.no_recent_data);

  return (
    <motion.div
      className="min-h-screen"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Background Ambient */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-primary-400/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-cyan-400/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Page Header */}
        <PageHeader
          title="مدیریت بیماران"
          description="لیست کامل بیماران تحت پایش سیستم"
          action={
            <motion.button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-600"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <UserPlus className="h-4 w-4" />
              <span>بیمار جدید</span>
            </motion.button>
          }
        />

        {/* Quick Stats */}
        <QuickStats
          data={
            data
              ? {
                  total: data.total,
                  high_alerts: data.data.reduce(
                    (sum, p) => sum + p.active_alerts_high,
                    0
                  ),
                  avg_risk: Math.round(
                    data.data
                      .filter((p) => p.risk_score != null)
                      .reduce((sum, p) => sum + (p.risk_score ?? 0), 0) /
                      Math.max(
                        data.data.filter((p) => p.risk_score != null).length,
                        1
                      )
                  ),
                }
              : null
          }
        />

        {/* Search & Filters */}
        <div className="space-y-3">
          <PatientSearchBar
            value={filters.search ?? ""}
            onChange={handleSearchChange}
            onFilterToggle={() => setIsFilterOpen((v) => !v)}
            hasActiveFilters={hasActiveFilters}
          />

          <PatientFilterPanel
            isOpen={isFilterOpen}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClose={() => setIsFilterOpen(false)}
            onReset={handleResetFilters}
          />
        </div>

        {/* Error State */}
        {isError && (
          <motion.div
            className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-sm text-red-600">
              خطا در دریافت اطلاعات. لطفاً صفحه را مجدداً بارگذاری کنید.
            </p>
          </motion.div>
        )}

        {/* Patient List */}
        {!isError && (
          <PatientList
            patients={data?.data ?? []}
            isLoading={isLoading}
            totalCount={data?.total}
          />
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={data.pages}
            onPageChange={setPage}
          />
        )}
      </div>
    </motion.div>
  );
}