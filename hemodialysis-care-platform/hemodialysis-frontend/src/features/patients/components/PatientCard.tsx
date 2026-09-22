'use client'

import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import {
  User,
  Scale,
  Bell,
  Clock,
  Droplets,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import type { PatientSummary } from '../types/patient.types'
import { formatDistanceToNow, formatDate } from '@/lib/utils/date.utils'
import { cn } from '@/lib/utils/cn'

interface PatientCardProps {
  patient: PatientSummary
  index: number
}

const VASCULAR_LABELS = {
  fistula: 'فیستول',
  graft: 'گرافت',
  catheter: 'کاتتر',
}

export function PatientCard({ patient, index }: PatientCardProps) {
  const router = useRouter()
  const alerts = patient.summary?.active_alerts
  const highAlerts = alerts?.high ?? 0
  const medAlerts = alerts?.medium ?? 0
  const totalAlerts = highAlerts + medAlerts + (alerts?.low ?? 0)
  const hasUrgent = highAlerts > 0
  const hasMedium = medAlerts > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      onClick={() =>
        router.push(`/clinician/patients/${patient.id}`)
      }
      className={cn(
        'group cursor-pointer rounded-2xl border p-5',
        'transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-0.5',
        hasUrgent
          ? 'border-red-200 bg-red-50/40 hover:border-red-300'
          : hasMedium
          ? 'border-amber-200 bg-amber-50/30 hover:border-amber-300'
          : 'border-slate-100 bg-white hover:border-[#BAE6FD]',
      )}
      style={{
        boxShadow: hasUrgent
          ? '0 2px 12px rgba(239,68,68,0.08)'
          : '0 2px 12px rgba(14,165,233,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {/* Avatar */}
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold',
            hasUrgent
              ? 'bg-red-100 text-red-600'
              : hasMedium
              ? 'bg-amber-100 text-amber-600'
              : 'bg-[#E0F2FE] text-[#0284C7]'
          )}
        >
          {patient.full_name.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#0F172A] truncate">
            {patient.full_name}
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            {patient.medical_record_number}
            {patient.age != null && ` · ${patient.age} سال`}
          </p>
        </div>

        {/* Alert badge */}
        {totalAlerts > 0 && (
          <div
            className={cn(
              'flex h-7 min-w-[28px] shrink-0 items-center justify-center rounded-full px-2',
              'text-[11px] font-bold',
              hasUrgent
                ? 'bg-red-500 text-white'
                : 'bg-amber-400 text-white'
            )}
          >
            {totalAlerts}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* Dry weight */}
        <StatBox
          icon={<Scale className="h-3.5 w-3.5" />}
          label="وزن خشک"
          value={patient.dry_weight ? `${patient.dry_weight}kg` : '—'}
        />

        {/* Vascular access */}
        <StatBox
          icon={<Droplets className="h-3.5 w-3.5" />}
          label="دسترسی"
          value={
            patient.vascular_access_type
              ? VASCULAR_LABELS[patient.vascular_access_type]
              : '—'
          }
        />

        {/* IDWG or weight status */}
        <StatBox
          icon={<User className="h-3.5 w-3.5" />}
          label="وضعیت"
          value={
            patient.summary?.weight_status === 'ok'
              ? '✓ مناسب'
              : patient.summary?.weight_status === 'warning'
              ? '⚠ هشدار'
              : patient.summary?.weight_status === 'critical'
              ? '🔴 بحرانی'
              : '—'
          }
          highlight={patient.summary?.weight_status !== 'ok'}
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100 mb-3" />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
          <Clock className="h-3.5 w-3.5 text-[#94A3B8]" />
          {patient.summary?.last_session
            ? formatDistanceToNow(patient.summary.last_session.session_date)
            : 'بدون جلسه'}
        </div>

        {patient.is_active ? (
          <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            فعال
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">غیرفعال</span>
        )}
      </div>
    </motion.div>
  )
}

function StatBox({
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
    <div className="flex flex-col items-center rounded-xl bg-slate-50/60 p-2.5 text-center">
      <span className="text-[#94A3B8] mb-1">{icon}</span>
      <p className="text-[10px] text-[#94A3B8] mb-0.5">{label}</p>
      <p
        className={cn(
          'text-xs font-semibold',
          highlight ? 'text-amber-600' : 'text-[#0F172A]'
        )}
      >
        {value}
      </p>
    </div>
  )
}