'use client'

import { motion } from 'motion/react'
import { Activity, Scale, Heart, AlertCircle } from 'lucide-react'
import type { SessionResponse } from '../types/session.types'
import { SESSION_EVENT_FA } from '@/types/common.types'
import { formatDate } from '@/lib/utils/date.utils'
import { cn } from '@/lib/utils/cn'

interface SessionListProps {
  sessions: SessionResponse[]
  patientId: string
}

export function SessionList({ sessions, patientId }: SessionListProps) {
  if (sessions.length === 0) return null

  return (
    <div className="space-y-3">
      {sessions.map((session, i) => (
        <SessionCard key={session.id} session={session} index={i} />
      ))}
    </div>
  )
}

function SessionCard({
  session,
  index,
}: {
  session: SessionResponse
  index: number
}) {
  const idwgKg =
    session.weight_gain != null ? session.weight_gain.toFixed(1) : null
  const hasEvents = session.intradialytic_events?.length > 0
  const hasDanger = session.intradialytic_events?.includes('chest_pain')

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'rounded-2xl border p-4 shadow-sm',
        hasDanger
          ? 'border-red-200 bg-red-50/40'
          : 'border-slate-100 bg-white'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-800">
          {formatDate(session.session_date)}
        </p>
        {session.duration_minutes && (
          <span className="text-xs text-slate-400">
            {session.duration_minutes} دقیقه
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Pre weight */}
        <MetricBox
          icon={<Scale className="h-3.5 w-3.5" />}
          label="وزن قبل"
          value={`${session.pre_weight} kg`}
        />

        {/* Post weight */}
        {session.post_weight != null && (
          <MetricBox
            icon={<Scale className="h-3.5 w-3.5" />}
            label="وزن بعد"
            value={`${session.post_weight} kg`}
          />
        )}

        {/* IDWG */}
        {idwgKg != null && (
          <MetricBox
            icon={<Activity className="h-3.5 w-3.5" />}
            label="افزایش وزن"
            value={`${idwgKg} kg`}
            highlight={Number(idwgKg) > 3}
          />
        )}

        {/* BP Pre */}
        {session.bp_pre_systolic && (
          <MetricBox
            icon={<Heart className="h-3.5 w-3.5" />}
            label="فشار قبل"
            value={`${session.bp_pre_systolic}/${session.bp_pre_diastolic}`}
          />
        )}
      </div>

      {/* Events */}
      {hasEvents && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {session.intradialytic_events.map((event) => (
            <span
              key={event}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[10px] font-medium',
                event === 'chest_pain'
                  ? 'bg-red-100 text-red-700'
                  : event === 'hypotension'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-600'
              )}
            >
              {SESSION_EVENT_FA[event] ?? event}
            </span>
          ))}
        </div>
      )}

      {session.notes && (
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          {session.notes}
        </p>
      )}
    </motion.div>
  )
}

function MetricBox({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-xl bg-slate-50/60 p-2.5">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-slate-400">{icon}</span>
        <span className="text-[10px] text-slate-400">{label}</span>
      </div>
      <p
        className={cn(
          'text-xs font-semibold',
          highlight ? 'text-amber-600' : 'text-slate-800'
        )}
      >
        {value}
      </p>
    </div>
  )
}