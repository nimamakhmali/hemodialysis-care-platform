'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Activity, ChevronLeft, Weight, Heart } from 'lucide-react'
import type { DialysisSession } from '../types/session.types'
import { formatDate } from '@/lib/utils/date.utils'

interface SessionListProps {
  sessions: DialysisSession[]
  patientId: string
}

export function SessionList({ sessions, patientId }: SessionListProps) {
  const router = useRouter()

  return (
    <div className="space-y-3">
      {sessions.map((session, i) => (
        <motion.div
          key={session.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() =>
            router.push(
              `/clinician/patients/${patientId}/sessions/${session.id}`
            )
          }
          className="
            flex items-center justify-between rounded-2xl border border-slate-100
            bg-white p-5 shadow-sm hover:shadow-md hover:border-primary-100
            cursor-pointer transition-all duration-200 group
          "
        >
          {/* Date + Icon */}
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
              <Activity className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {formatDate(session.session_date)}
              </p>
              {session.duration_minutes && (
                <p className="text-xs text-slate-400">
                  {session.duration_minutes} دقیقه
                </p>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="flex items-center gap-6">
            {/* Weight */}
            <div className="flex items-center gap-1.5">
              <Weight className="h-3.5 w-3.5 text-slate-300" />
              <div className="text-right">
                <p className="text-xs font-medium text-slate-700">
                  {session.pre_weight} kg
                </p>
                {session.idwg_percent != null && (
                  <p
                    className={`text-[11px] ${
                      session.idwg_percent > 5
                        ? 'text-red-500'
                        : session.idwg_percent > 3
                        ? 'text-amber-500'
                        : 'text-emerald-500'
                    }`}
                  >
                    IDWG {session.idwg_percent.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>

            {/* BP */}
            {session.bp_pre_systolic && (
              <div className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-slate-300" />
                <p className="text-xs font-medium text-slate-700">
                  {session.bp_pre_systolic}/{session.bp_pre_diastolic}
                </p>
              </div>
            )}

            {/* Events badges */}
            {session.intradialytic_events &&
              session.intradialytic_events.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700 font-medium">
                  {session.intradialytic_events.length} رخداد
                </span>
              )}
          </div>

          <ChevronLeft className="h-4 w-4 text-slate-300 group-hover:text-primary-400 transition-colors" />
        </motion.div>
      ))}
    </div>
  )
}