// src/features/dialysis-sessions/components/SessionCard.tsx
'use client'

import { motion } from 'motion/react'
import {
  Scale, Activity, Droplets, Clock,
  AlertTriangle, CheckCircle, ChevronLeft,
} from 'lucide-react'
import Link from 'next/link'
import { formatPersianDate } from '@/lib/utils/date.utils'
import { SESSION_EVENTS_FA } from '@/lib/utils/medical.utils'
import type { DialysisSession } from '../types/session.types'
import { cn } from '@/lib/utils/cn'

interface Props {
  session: DialysisSession
  patientId: string
  index?: number
}

function IDWGBadge({ percent }: { percent?: number }) {
  if (percent == null) return null
  const color =
    percent >= 5 ? 'bg-red-50 text-red-600 border-red-200' :
    percent >= 3 ? 'bg-amber-50 text-amber-600 border-amber-200' :
    'bg-green-50 text-green-600 border-green-200'
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', color)}>
      IDWG: {percent.toFixed(1)}%
    </span>
  )
}

function BPDisplay({ sys, dia, label }: { sys?: number; dia?: number; label: string }) {
  if (!sys || !dia) return null
  const color =
    sys >= 180 ? 'text-red-500' :
    sys >= 160 ? 'text-amber-500' :
    sys <= 90 ? 'text-red-500' :
    'text-text-primary'
  return (
    <div className="text-center">
      <p className="text-xs text-text-muted mb-0.5">{label}</p>
      <p className={cn('text-sm font-semibold', color)}>
        {sys}/{dia}
      </p>
    </div>
  )
}

export function SessionCard({ session, patientId, index = 0 }: Props) {
  const hasEvents = session.intradialytic_events && session.intradialytic_events.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: index * 0.06,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Link href={`/clinician/patients/${patientId}/sessions/${session.id}`}>
        <div
          className={cn(
            'bg-white rounded-2xl border p-5 cursor-pointer',
            'hover:shadow-azure hover:border-primary-200',
            'transition-all duration-300',
            hasEvents ? 'border-amber-200' : 'border-primary-100'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center',
                hasEvents ? 'bg-amber-50' : 'bg-primary-50'
              )}>
                {hasEvents
                  ? <AlertTriangle className="w-4 h-4 text-amber-500" />
                  : <CheckCircle className="w-4 h-4 text-primary-500" />
                }
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">
                  {formatPersianDate(session.session_date)}
                </p>
                {session.duration_minutes && (
                  <div className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{session.duration_minutes} دقیقه</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IDWGBadge percent={session.weight_gain_percent} />
              <ChevronLeft className="w-4 h-4 text-text-muted" />
            </div>
          </div>

          {/* Data Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* وزن */}
            <div className="bg-surface-primary rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Scale className="w-3.5 h-3.5 text-primary-500" />
                <span className="text-xs text-text-muted">وزن</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {session.pre_weight}
                {session.post_weight && (
                  <span className="text-text-muted font-normal">
                    {' → '}{session.post_weight}
                  </span>
                )}
              </p>
              <p className="text-xs text-text-muted">kg</p>
            </div>

            {/* UF */}
            <div className="bg-surface-primary rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-xs text-text-muted">UF</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {session.uf_volume != null
                  ? `${session.uf_volume.toFixed(1)} L`
                  : '—'}
              </p>
            </div>

            {/* BP قبل */}
            <div className="bg-surface-primary rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-xs text-text-muted">BP قبل</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {session.bp_pre_systolic && session.bp_pre_diastolic
                  ? `${session.bp_pre_systolic}/${session.bp_pre_diastolic}`
                  : '—'}
              </p>
            </div>
          </div>

          {/* BP سریالی */}
          {(session.bp_during_systolic || session.bp_post_systolic) && (
            <div className="flex items-center justify-around bg-surface-secondary rounded-xl p-3 mb-3">
              <BPDisplay sys={session.bp_pre_systolic} dia={session.bp_pre_diastolic} label="قبل" />
              {session.bp_during_systolic && (
                <>
                  <div className="w-px h-8 bg-primary-100" />
                  <BPDisplay sys={session.bp_during_systolic} dia={session.bp_during_diastolic} label="حین" />
                </>
              )}
              {session.bp_post_systolic && (
                <>
                  <div className="w-px h-8 bg-primary-100" />
                  <BPDisplay sys={session.bp_post_systolic} dia={session.bp_post_diastolic} label="بعد" />
                </>
              )}
            </div>
          )}

          {/* رخدادها */}
          {hasEvents && (
            <div className="flex flex-wrap gap-1.5">
              {session.intradialytic_events!.map((event) => (
                <span
                  key={event}
                  className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full"
                >
                  {SESSION_EVENTS_FA[event] ?? event}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}