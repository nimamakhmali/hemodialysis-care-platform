'use client'

import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ChevronLeft, User } from 'lucide-react'
import type { UrgentPatientRow } from '../../types/clinician-dashboard.types'
import { EmptyState } from '@/components/ui/EmptyState'

interface UrgentPatientsTableProps {
  patients: UrgentPatientRow[]
}

export function UrgentPatientsTable({ patients }: UrgentPatientsTableProps) {
  const router = useRouter()

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <h2 className="font-semibold text-slate-800 text-sm">
            بیماران نیازمند توجه
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          {patients.length} بیمار
        </span>
      </div>

      {/* Content */}
      {patients.length === 0 ? (
        <EmptyState
          title="هشداری وجود ندارد"
          description="در حال حاضر هیچ بیماری نیاز به توجه فوری ندارد"
          size="sm"
        />
      ) : (
        <div className="divide-y divide-slate-50">
          {patients.map((patient, i) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => router.push(`/clinician/patients/${patient.id}`)}
              className="
                flex items-center justify-between px-6 py-4
                hover:bg-slate-50/70 cursor-pointer transition-colors
                group
              "
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                  <User className="h-4 w-4 text-primary-500" />
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {patient.full_name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {patient.medical_record_number}
                  </p>
                </div>
              </div>

              {/* Alerts */}
              <div className="flex items-center gap-2 shrink-0">
                {patient.active_alerts_high > 0 && (
                  <span className="
                    flex h-5 min-w-5 items-center justify-center
                    rounded-full bg-red-500 px-1.5
                    text-[10px] font-bold text-white
                  ">
                    {patient.active_alerts_high}
                  </span>
                )}
                {patient.active_alerts_medium > 0 && (
                  <span className="
                    flex h-5 min-w-5 items-center justify-center
                    rounded-full bg-amber-400 px-1.5
                    text-[10px] font-bold text-white
                  ">
                    {patient.active_alerts_medium}
                  </span>
                )}
                {patient.active_alerts_low > 0 && (
                  <span className="
                    flex h-5 min-w-5 items-center justify-center
                    rounded-full bg-slate-200 px-1.5
                    text-[10px] font-bold text-slate-600
                  ">
                    {patient.active_alerts_low}
                  </span>
                )}
                <ChevronLeft className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}