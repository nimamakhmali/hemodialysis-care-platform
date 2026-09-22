'use client'

import { motion } from 'motion/react'
import { Users, FileText, ShieldCheck, Settings } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { QUERY_KEYS } from '@/lib/query/queryClient'
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { pageVariants, staggerContainer, cardVariants } from '@/lib/animation/variants'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import type { SystemStats } from '@/types/api.types'
import type { ApiResponse } from '@/types/api.types'

function useSystemStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.systemStats],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<SystemStats>>(
        API_ENDPOINTS.admin.system.stats
      )
      return res.data.data
    },
    staleTime: 2 * 60 * 1000,
  })
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useSystemStats()

  const stats = [
    {
      label: 'کاربران',
      value: data?.total_users ?? 0,
      icon: Users,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
    },
    {
      label: 'بیماران',
      value: data?.total_patients ?? 0,
      icon: ShieldCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'بیماران فعال',
      value: data?.active_patients ?? 0,
      icon: ShieldCheck,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
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
        title="داشبورد مدیریت"
        description="وضعیت کلی سیستم"
      />

      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={cardVariants}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} mb-3`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {isLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <AnimatedNumber value={stat.value} />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Role breakdown */}
      {data?.users_by_role && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">
            توزیع نقش‌ها
          </h3>
          <div className="space-y-2">
            {Object.entries(data.users_by_role).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="text-xs text-slate-600">{
                  role === 'patient' ? 'بیمار' :
                  role === 'clinician' ? 'کلینیسین' :
                  role === 'admin' ? 'ادمین' : role
                }</span>
                <span className="text-xs font-semibold text-slate-800">
                  {count as number}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}