'use client'

import { motion } from 'motion/react'
import {
  Users,
  AlertTriangle,
  AlertCircle,
  ClipboardList,
  Clock,
} from 'lucide-react'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import type { ClinicianStats } from '../../types/clinician-dashboard.types'

interface StatsOverviewRowProps {
  stats: ClinicianStats
}

export function StatsOverviewRow({ stats }: StatsOverviewRowProps) {
  const items = [
    {
      label: 'کل بیماران',
      value: stats.total_patients,
      icon: Users,
      color: 'text-primary-600',
      bg: 'from-primary-50 to-sky-50',
      border: 'border-primary-100',
      glow: 'shadow-primary-100/40',
    },
    {
      label: 'هشدار بحرانی',
      value: stats.active_alerts_high,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'from-red-50 to-rose-50',
      border: 'border-red-100',
      glow: 'shadow-red-100/40',
      urgent: stats.active_alerts_high > 0,
    },
    {
      label: 'هشدار متوسط',
      value: stats.active_alerts_medium,
      icon: AlertCircle,
      color: 'text-amber-600',
      bg: 'from-amber-50 to-yellow-50',
      border: 'border-amber-100',
      glow: 'shadow-amber-100/40',
    },
    {
      label: 'توصیه در انتظار',
      value: stats.pending_recommendations,
      icon: ClipboardList,
      color: 'text-violet-600',
      bg: 'from-violet-50 to-purple-50',
      border: 'border-violet-100',
      glow: 'shadow-violet-100/40',
      urgent: stats.pending_recommendations > 0,
    },
    {
      label: 'بدون داده اخیر',
      value: stats.patients_with_no_recent_data,
      icon: Clock,
      color: 'text-slate-500',
      bg: 'from-slate-50 to-gray-50',
      border: 'border-slate-100',
      glow: 'shadow-slate-100/40',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
          className={`
            relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5
            shadow-sm hover:shadow-md transition-shadow duration-300
            ${item.bg} ${item.border}
          `}
        >
          {item.urgent && (
            <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-current animate-pulse" />
          )}

          <div className="flex items-start justify-between mb-3">
            <div
              className={`
              flex h-10 w-10 items-center justify-center rounded-xl
              bg-white/70 backdrop-blur-sm shadow-sm
            `}
            >
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
          </div>

          <div>
            <div className={`text-2xl font-bold ${item.color}`}>
              <AnimatedNumber value={item.value} />
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-tight">
              {item.label}
            </p>
          </div>

          {/* Decorative circle */}
          <div
            className={`
            absolute -bottom-4 -left-4 w-16 h-16 rounded-full
            opacity-10 ${item.color} bg-current
          `}
          />
        </motion.div>
      ))}
    </div>
  )
}