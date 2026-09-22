'use client'

import { motion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  Users, Bell, ClipboardList, AlertTriangle,
  TrendingUp, Clock, CheckCircle
} from 'lucide-react'
import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { QUERY_KEYS } from '@/lib/query/queryClient'
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { pageVariants, staggerContainer, cardVariants } from '@/lib/animation/variants'
import { formatDistanceToNow } from '@/lib/utils/date.utils'
import { ALERT_SEVERITY_COLORS } from '@/config/constants'
import type { ClinicianDashboard } from '@/types/api.types'
import type { ApiResponse } from '@/types/api.types'

function useClinicianDashboard() {
  return useQuery({
    queryKey: [QUERY_KEYS.clinicianDashboard],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ClinicianDashboard>>(
        API_ENDPOINTS.clinician.dashboard
      )
      return res.data.data
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}

export default function ClinicianDashboardPage() {
  const router = useRouter()
  const { data, isLoading } = useClinicianDashboard()

  const stats = [
    {
      label: 'کل بیماران',
      value: data?.stats.total_patients ?? 0,
      icon: Users,
      color: 'text-[#0284C7]',
      bg: 'bg-[#E0F2FE]',
    },
    {
      label: 'هشدار بحرانی',
      value: data?.stats.active_alerts_high ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'هشدار متوسط',
      value: data?.stats.active_alerts_medium ?? 0,
      icon: Bell,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'توصیه در انتظار',
      value: data?.stats.pending_recommendations ?? 0,
      icon: ClipboardList,
      color: 'text-[#0284C7]',
      bg: 'bg-[#E0F2FE]',
    },
  ]

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <PageHeader
        title="داشبورد"
        description="وضعیت کلی بیماران و هشدارها"
      />

      {/* Stats */}
      <motion.div
        variants={staggerContainer(0.07)}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((s) => (
          <motion.div
            key={s.label}
            variants={cardVariants}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg} mb-3`}
            >
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <AnimatedNumber value={s.value} />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Urgent Patients */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">
              بیماران نیازمند توجه
            </h3>
            <button
              onClick={() => router.push('/clinician/patients')}
              className="text-xs text-[#0EA5E9]"
            >
              همه
            </button>
          </div>

          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          )}

          {!isLoading && (data?.urgent_patients.length ?? 0) === 0 && (
            <div className="flex flex-col items-center py-8 text-slate-400">
              <CheckCircle className="h-8 w-8 text-emerald-400 mb-2" />
              <p className="text-sm">هشداری وجود ندارد</p>
            </div>
          )}

          {!isLoading && data?.urgent_patients.map((p) => (
            <div
              key={p.patient_id}
              onClick={() =>
                router.push(`/clinician/patients/${p.patient_id}`)
              }
              className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 mb-2 hover:border-[#BAE6FD] hover:bg-[#F0F9FF] cursor-pointer transition-colors"
            >
              <div
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                  ALERT_SEVERITY_COLORS[p.highest_severity]?.dot
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate">
                  {p.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  {p.alert_count} هشدار
                  {p.last_session_date &&
                    ` · ${formatDistanceToNow(p.last_session_date)}`}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pending Recommendations */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">
              توصیه‌های در انتظار
            </h3>
            <button
              onClick={() => router.push('/clinician/recommendations')}
              className="text-xs text-[#0EA5E9]"
            >
              همه
            </button>
          </div>

          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          )}

          {!isLoading && (data?.pending_recommendations.length ?? 0) === 0 && (
            <div className="flex flex-col items-center py-8 text-slate-400">
              <CheckCircle className="h-8 w-8 text-emerald-400 mb-2" />
              <p className="text-sm">همه توصیه‌ها بررسی شده‌اند</p>
            </div>
          )}

          {!isLoading && data?.pending_recommendations.slice(0, 5).map((rec) => (
            <div
              key={rec.id}
              onClick={() => router.push('/clinician/recommendations')}
              className="rounded-xl border border-amber-100 bg-amber-50/40 p-3 mb-2 cursor-pointer hover:bg-amber-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-slate-700">
                  {rec.patient_name}
                </p>
                <span
                  className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                    ALERT_SEVERITY_COLORS[rec.priority]?.badge
                  }`}
                >
                  {rec.priority === 'high'
                    ? 'بحرانی'
                    : rec.priority === 'medium'
                    ? 'متوسط'
                    : 'کم'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {rec.draft_for_clinician}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {data?.recent_activity && data.recent_activity.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">
            فعالیت‌های اخیر
          </h3>
          <div className="space-y-2">
            {data.recent_activity.slice(0, 8).map((activity, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-xs text-slate-600"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-[#0EA5E9] shrink-0" />
                <span className="flex-1 text-slate-700">
                  {activity.patient_name}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {activity.description}
                </span>
                <span className="text-slate-300 text-[11px] shrink-0">
                  {formatDistanceToNow(activity.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}