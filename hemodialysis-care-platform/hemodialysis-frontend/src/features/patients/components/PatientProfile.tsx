'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import {
  User, Scale, Droplets, Calendar, Phone, Activity,
  FlaskConical, Bell, ClipboardList, Clock,
} from 'lucide-react'
import type { PatientDetail } from '../types/patient.types'
import { LabSummaryGrid } from '@/features/lab-results/components/LabSummaryGrid'
import { SessionList } from '@/features/dialysis-sessions/components/SessionList'
import { AlertCard } from '@/features/alerts/components/AlertCard'
import { PatientRecommendations } from '@/features/recommendations/components/PatientRecommendations'
import { useSessions } from '@/features/dialysis-sessions/hooks/useSessions'
import { usePatientAlerts } from '@/features/alerts/hooks/useAlerts'
import { useAcknowledgeAlert, useResolveAlert } from '@/features/alerts/hooks/useAlerts'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils/date.utils'
import { pageVariants } from '@/lib/animation/variants'

type Tab = 'overview' | 'sessions' | 'labs' | 'alerts' | 'recommendations'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'خلاصه', icon: <User className="h-3.5 w-3.5" /> },
  { key: 'sessions', label: 'جلسات', icon: <Activity className="h-3.5 w-3.5" /> },
  { key: 'labs', label: 'آزمایش', icon: <FlaskConical className="h-3.5 w-3.5" /> },
  { key: 'alerts', label: 'هشدارها', icon: <Bell className="h-3.5 w-3.5" /> },
  { key: 'recommendations', label: 'توصیه‌ها', icon: <ClipboardList className="h-3.5 w-3.5" /> },
]

const GENDER_LABELS = { male: 'آقای', female: 'خانم' }
const VASCULAR_LABELS = {
  fistula: 'فیستول',
  graft: 'گرافت',
  catheter: 'کاتتر',
}

interface PatientProfileProps {
  patient: PatientDetail
}

export function PatientProfile({ patient }: PatientProfileProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const { data: sessions } = useSessions(patient.id, { size: 5 })
  const { data: alertsData } = usePatientAlerts(patient.id, {
    status: 'new',
  })
  const { mutate: acknowledge } = useAcknowledgeAlert()
  const { mutate: resolve } = useResolveAlert()

  const alerts = alertsData?.data ?? []

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* Patient Header */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 shrink-0">
            <User className="h-7 w-7 text-primary-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="text-xs text-slate-400">
                  {patient.gender ? GENDER_LABELS[patient.gender] : ''}
                </p>
                <h1 className="text-xl font-bold text-slate-800">
                  {patient.full_name}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  کد: {patient.medical_record_number}
                  {patient.age != null && ` · ${patient.age} ساله`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {patient.summary?.active_alerts && (
                  <>
                    {patient.summary.active_alerts.high > 0 && (
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                        {patient.summary.active_alerts.high} هشدار بحرانی
                      </span>
                    )}
                    {patient.summary.active_alerts.medium > 0 && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                        {patient.summary.active_alerts.medium} هشدار متوسط
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Quick info */}
            <div className="flex flex-wrap gap-4 mt-3">
              <InfoChip
                icon={<Scale className="h-3.5 w-3.5" />}
                label={`وزن خشک: ${patient.dry_weight} kg`}
              />
              {patient.vascular_access_type && (
                <InfoChip
                  icon={<Droplets className="h-3.5 w-3.5" />}
                  label={VASCULAR_LABELS[patient.vascular_access_type]}
                />
              )}
              {patient.dialysis_start_date && (
                <InfoChip
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  label={`شروع: ${formatDate(patient.dialysis_start_date)}`}
                />
              )}
              {patient.phone_number && (
                <InfoChip
                  icon={<Phone className="h-3.5 w-3.5" />}
                  label={patient.phone_number}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-slate-100 bg-white p-1 shadow-sm overflow-x-auto">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`
              flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium
              transition-all duration-150
              ${activeTab === key
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
              }
            `}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Clinical Summary */}
          {patient.summary?.risk && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-xs font-semibold text-amber-800 mb-1">
                ریسک: {patient.summary.risk.score}/100
              </p>
              <p className="text-xs text-amber-700">
                {patient.summary.risk.interpretation_fa}
              </p>
            </div>
          )}

          {/* Last session */}
          {patient.summary?.last_session && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-700 mb-2">
                آخرین جلسه
              </p>
              <div className="grid grid-cols-2 gap-2">
                <InfoRow
                  label="وزن قبل"
                  value={`${patient.summary.last_session.pre_weight} kg`}
                />
                {patient.summary.last_session.idwg_percent != null && (
                  <InfoRow
                    label="IDWG"
                    value={`${patient.summary.last_session.idwg_percent.toFixed(1)}%`}
                    warning={(patient.summary.last_session.idwg_percent ?? 0) > 3}
                  />
                )}
              </div>
            </div>
          )}

          {/* Comorbidities */}
          {patient.comorbidities && Object.keys(patient.comorbidities).length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-700 mb-2">
                بیماری‌های همراه
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(patient.comorbidities)
                  .filter(([, v]) => v)
                  .map(([k]) => (
                    <span
                      key={k}
                      className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600"
                    >
                      {k}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {patient.clinical_notes && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-700 mb-1">
                یادداشت کلینیکی
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                {patient.clinical_notes}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div>
          {(sessions?.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Activity />}
              title="جلسه‌ای ثبت نشده"
              size="sm"
            />
          ) : (
            <SessionList
              sessions={sessions!.data}
              patientId={patient.id}
            />
          )}
        </div>
      )}

      {activeTab === 'labs' && <LabSummaryGrid patientId={patient.id} />}

      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <EmptyState title="هشدار فعالی وجود ندارد" size="sm" />
          ) : (
            alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={(id) => acknowledge({ alertId: id })}
                onResolve={(id) => resolve({ alertId: id })}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'recommendations' && (
        <PatientRecommendations patientId={patient.id} />
      )}
    </motion.div>
  )
}

function InfoChip({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-600">
      <span className="text-slate-400">{icon}</span>
      {label}
    </div>
  )
}

function InfoRow({
  label,
  value,
  warning = false,
}: {
  label: string
  value: string
  warning?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className={`text-xs font-medium ${warning ? 'text-amber-600' : 'text-slate-800'}`}>
        {value}
      </span>
    </div>
  )
}