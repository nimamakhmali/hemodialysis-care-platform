// src/features/dashboard/components/patient/PatientDashboard.tsx
"use client";

import { motion } from "motion/react";
import { Bell, BookOpen, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { usePatientDashboard } from "../../hooks/usePatientDashboard";
import { WeightStatusCard } from "./WeightStatusCard";
import { BPStatusCard } from "./BPStatusCard";
import { RiskScoreCard } from "./RiskScoreCard";
import { TodayTasksWidget } from "./TodayTasksWidget";
import { LabSummarySection } from "./LabSummarySection";
import { staggerContainer, fadeInUp } from "@/lib/animation/variants";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/date.utils";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Skeleton className="h-60 rounded-2xl" />
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    </div>
  );
}

interface Props {
  patientId: string;
}

export function PatientDashboard({ patientId }: Props) {
  const { data, isLoading, isError, refetch } = usePatientDashboard(patientId);

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-slate-500">خطا در بارگذاری داشبورد</p>
        <button
          onClick={() => refetch()}
          className="text-sm text-sky-600 hover:underline"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "صبح بخیر" : hour < 17 ? "عصر بخیر" : "شب بخیر";

  return (
    <motion.div
      variants={staggerContainer(0.08)}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div
        variants={fadeInUp}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br 
                   from-sky-500 to-cyan-500 p-6 text-white"
      >
        {/* Ambient circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full 
                        bg-white/10 blur-xl" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full 
                        bg-white/10 blur-xl" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sky-100 text-sm">{greeting} 👋</p>
            <h1 className="text-2xl font-bold mt-1">
              {data.patient_info.full_name}
            </h1>
            <p className="text-sky-100 text-sm mt-2">
              {data.patient_info.dialysis_frequency} جلسه دیالیز در هفته
            </p>
          </div>

          {/* Notification indicator */}
          {data.unread_count > 0 && (
            <Link
              href="/patient/messages"
              className="relative flex items-center gap-2 bg-white/20 
                         hover:bg-white/30 transition-colors rounded-xl px-3 py-2"
            >
              <Bell className="w-4 h-4" />
              <span className="text-sm font-medium">
                {data.unread_count} پیام جدید
              </span>
              <motion.div
                className="absolute -top-1 -right-1 w-2.5 h-2.5 
                           rounded-full bg-red-400"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </Link>
          )}
        </div>
      </motion.div>

      {/* Status Cards Row */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        <WeightStatusCard summary={data.weight_summary} />
        <BPStatusCard summary={data.bp_summary} />
        {data.risk && <RiskScoreCard risk={data.risk} />}
      </motion.div>

      {/* Lab Summary */}
      {data.lab_summary && Object.keys(data.lab_summary).length > 0 && (
        <motion.div variants={fadeInUp}>
          <LabSummarySection
            labs={data.lab_summary}
            patientId={patientId}
          />
        </motion.div>
      )}

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Today Tasks */}
        <motion.div variants={fadeInUp}>
          <TodayTasksWidget tasks={data.today_tasks} />
        </motion.div>

        {/* Relevant Education */}
        {data.relevant_education.length > 0 && (
          <motion.div variants={fadeInUp}>
            <div className="rounded-2xl border border-slate-100 bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-sky-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    آموزش مرتبط با شما
                  </h3>
                </div>
                <Link
                  href="/patient/education"
                  className="text-xs text-sky-600 hover:text-sky-700 
                             flex items-center gap-1"
                >
                  همه
                  <ChevronLeft className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-2">
                {data.relevant_education.map((edu, idx) => (
                  <motion.div
                    key={edu.topic_code}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.07 }}
                  >
                    <Link
                      href={`/patient/education/${edu.topic_code}`}
                      className="flex items-center gap-3 p-3 rounded-xl 
                                 bg-slate-50 hover:bg-sky-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky-100 
                                      flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-sky-600" />
                      </div>
                      <span className="text-sm text-slate-700 font-medium flex-1">
                        {edu.title_fa}
                      </span>
                      <ChevronLeft
                        className="w-4 h-4 text-slate-300 
                                      group-hover:text-sky-500 transition-colors"
                      />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Recent Messages preview */}
      {data.recent_messages.length > 0 && (
        <motion.div variants={fadeInUp}>
          <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800">
                پیام‌های اخیر
              </h3>
              <Link
                href="/patient/messages"
                className="text-xs text-sky-600 hover:underline"
              >
                مشاهده همه
              </Link>
            </div>
            <div className="space-y-2">
              {data.recent_messages.slice(0, 2).map((msg) => (
                <Link
                  key={msg.id}
                  href="/patient/messages"
                  className="flex items-center gap-3 p-3 rounded-xl 
                             bg-white border border-sky-100 hover:border-sky-300 
                             transition-colors group"
                >
                  {!msg.read_at && (
                    <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "text-sm flex-1",
                      !msg.read_at
                        ? "font-semibold text-slate-800"
                        : "text-slate-600"
                    )}
                  >
                    {msg.title}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatRelativeTime(msg.sent_at)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}