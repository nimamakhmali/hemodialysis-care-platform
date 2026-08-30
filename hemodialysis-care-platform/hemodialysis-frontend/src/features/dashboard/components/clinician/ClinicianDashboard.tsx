// src/features/dashboard/components/clinician/ClinicianDashboard.tsx
"use client";

import { motion } from "motion/react";
import { staggerContainer, fadeInUp } from "@/lib/animation/variants";
import { StatsOverviewRow } from "./StatsOverviewRow";
import { UrgentPatientsTable } from "./UrgentPatientsTable";
import { PendingRecsWidget } from "./PendingRecsWidget";
import { RecentActivityFeed } from "./RecentActivityFeed";
import { useClinicianDashboard } from "../../hooks/useClinicianDashboard";
import { Skeleton } from "@/components/ui/Skeleton";
import { AlertTriangle } from "lucide-react";

export function ClinicianDashboard() {
  const { data, isLoading, isError, refetch } = useClinicianDashboard();

  if (isLoading) return <ClinicianDashboardSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-slate-600">خطا در بارگذاری داشبورد</p>
        <button
          onClick={() => refetch()}
          className="text-sm text-sky-600 hover:text-sky-700 underline"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      variants={staggerContainer(0.1)}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Stats Row */}
      <motion.div variants={fadeInUp}>
        <StatsOverviewRow stats={data.stats} />
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Urgent Patients — 2 cols */}
        <motion.div variants={fadeInUp} className="xl:col-span-2">
          <UrgentPatientsTable patients={data.urgent_patients} />
        </motion.div>

        {/* Pending Recs — 1 col */}
        <motion.div variants={fadeInUp}>
          <PendingRecsWidget recommendations={data.pending_recommendations} />
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={fadeInUp}>
        <RecentActivityFeed activities={data.recent_activity} />
      </motion.div>
    </motion.div>
  );
}

function ClinicianDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Skeleton className="xl:col-span-2 h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}