// src/features/dialysis-sessions/components/SessionDetail.tsx
'use client'

import { motion } from 'motion/react'
import {
  Scale, Activity, Droplets, Clock,
  AlertTriangle, CheckCircle, Calendar,
} from 'lucide-react'
import { formatPersianDate } from '@/lib/utils/date.utils'
import { SESSION_EVENTS_FA, calculateIDWG } from '@/lib/utils/medical.utils'
import { IDWGGauge } from './IDWGGauge'
import { cn } from '@/lib/utils/cn'
import type { DialysisSession } from '../types/session.types'

interface Props {
  session: DialysisSession
}

function InfoCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  children,
  delay,
}: {
  icon: any
  iconColor: string
  iconBg: string
  label: string
  children: React.ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: delay ?? 0 }}
      className="bg-white rounded-2xl border border-primary-100 shadow-sm p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
        <h4 className="font-medium text-text-primary">{label}</h4>
      </div>
      {children}
    </motion.div>
  )
}

function BPSection({
  label,
  systolic,
  diastolic,
  colorClass,
}: {
  label: string
  systolic?: number
  diastolic?: number
  colorClass?: string
}) {
  if (!systolic || !diastolic) return null
  return (
    <div className="text-center bg-surface-primary rounded-xl p-3">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className={cn('text-xl font-bold', colorClass ?? 'text-text-primary')}>
        {systolic}/{diastolic}
      </p>
      <p className="text-xs text-text-muted">mmHg</p>
    </div>
  )
}

export function SessionDetail({ session }: Props) {
  const idwg =
    session.weight_gain_percent != null && session.dry_weight_at_session
      ? {
          percent: session.weight_gain_percent,
          kg: session.weight_gain ?? 0,
        }
      : null

  const hasEvents =
    session.intradialytic_events && session.intradialytic_events.length > 0

  return (
    <div className="space-y-4">
      {/* Header اطلاعات پایه */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-l from-primary-50 to-cyan-50 rounded-2xl border border-primary-100 p-5"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-lg">
              {formatPersianDate(session.session_date)}
            </h3>
            {session.duration_minutes && (
              <div className="flex items-center gap-1.5 text-sm text-text-muted mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{session.duration_minutes} دقیقه</span>
              </div>
            )}
          </div>
        </div>

        {hasEvents && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {session.intradialytic_events!.map((e) => (
              <span
                key={e}
                className="text-xs bg-amber-100 text-amber-700 border border-amber-200
                           px-2.5 py-1 rounded-full flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                {SESSION_EVENTS_FA[e] ?? e}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* گرید کارت‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* وزن و IDWG */}
        <InfoCard
          icon={Scale}
          iconColor="text-primary-600"
          iconBg="bg-primary-50"
          label="وزن و IDWG"
          delay={0.1}
        >
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'وزن قبل', value: session.pre_weight, unit: 'kg' },
              { label: 'وزن بعد', value: session.post_weight, unit: 'kg' },
              { label: 'وزن خشک', value: session.dry_weight_at_session, unit: 'kg' },
            ].map(({ label, value, unit }) => (
              <div key={label} className="bg-surface-primary rounded-xl p-2.5 text-center">
                <p className="text-xs text-text-muted mb-1">{label}</p>
                <p className="font-semibold text-text-primary">
                  {value != null ? `${value}` : '—'}
                </p>
                <p className="text-xs text-text-muted">{unit}</p>
              </div>
            ))}
          </div>

          {idwg && (
            <IDWGGauge
              percent={idwg.percent}
              kg={idwg.kg}
              dryWeight={session.dry_weight_at_session}
            />
          )}

          {session.uf_volume != null && (
            <div className="flex items-center gap-2 text-sm bg-cyan-50 rounded-xl px-3 py-2 mt-3">
              <Droplets className="w-4 h-4 text-cyan-500" />
              <span className="text-cyan-700">UF: {session.uf_volume.toFixed(2)} L</span>
            </div>
          )}
        </InfoCard>

        {/* فشار خون */}
        <InfoCard
          icon={Activity}
          iconColor="text-rose-500"
          iconBg="bg-rose-50"
          label="فشار خون"
          delay={0.2}
        >
          <div className="grid grid-cols-3 gap-3">
            <BPSection
              label="قبل"
              systolic={session.bp_pre_systolic}
              diastolic={session.bp_pre_diastolic}
              colorClass={
                session.bp_pre_systolic && session.bp_pre_systolic >= 160
                  ? 'text-amber-500'
                  : undefined
              }
            />
            <BPSection
              label="حین"
              systolic={session.bp_during_systolic}
              diastolic={session.bp_during_diastolic}
              colorClass={
                session.bp_during_systolic && session.bp_during_systolic < 90
                  ? 'text-red-500'
                  : undefined
              }
            />
            <BPSection
              label="بعد"
              systolic={session.bp_post_systolic}
              diastolic={session.bp_post_diastolic}
            />
          </div>

          {session.had_intradialytic_hypotension && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200
                         rounded-xl px-3 py-2"
            >
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">
                افت فشار حین دیالیز (IDH) رخ داده است
              </span>
            </motion.div>
          )}
        </InfoCard>
      </div>

      {/* یادداشت */}
      {session.notes && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-primary-100 p-5"
        >
          <h4 className="font-medium text-text-primary mb-2">یادداشت</h4>
          <p className="text-sm text-text-secondary leading-relaxed">{session.notes}</p>
        </motion.div>
      )}
    </div>
  )
}