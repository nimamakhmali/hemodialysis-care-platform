'use client'

import { motion } from 'motion/react'
import {
  FlaskConical,
  Activity,
  Smile,
  MessageSquare,
  Clock,
} from 'lucide-react'
import type { RecentActivity } from '../../types/clinician-dashboard.types'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDistanceToNow } from '@/lib/utils/date.utils'

interface RecentActivityFeedProps {
  activities: RecentActivity[]
}

const ACTIVITY_ICON = {
  lab: { Icon: FlaskConical, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  session: { Icon: Activity, color: 'text-primary-500', bg: 'bg-primary-50' },
  symptom: { Icon: Smile, color: 'text-amber-500', bg: 'bg-amber-50' },
  message: { Icon: MessageSquare, color: 'text-violet-500', bg: 'bg-violet-50' },
}

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50">
        <h2 className="font-semibold text-slate-800 text-sm">
          فعالیت‌های اخیر
        </h2>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          title="فعالیتی ثبت نشده"
          description="هنوز داده‌ای در سیستم ثبت نشده است"
          size="sm"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-slate-50">
          {activities.slice(0, 9).map((activity, i) => {
            const config = ACTIVITY_ICON[activity.type]
            return (
              <motion.div
                key={`${activity.patient_id}-${activity.time}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 bg-white px-5 py-4"
              >
                <div
                  className={`
                  flex h-8 w-8 shrink-0 items-center justify-center
                  rounded-xl ${config.bg}
                `}
                >
                  <config.Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {activity.patient_name}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-slate-300" />
                    <span className="text-[10px] text-slate-400">
                      {formatDistanceToNow(activity.time)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}