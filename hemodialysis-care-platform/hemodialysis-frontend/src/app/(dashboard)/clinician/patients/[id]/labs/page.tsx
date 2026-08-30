// src/app/(dashboard)/clinician/patients/[id]/labs/page.tsx
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, TrendingUp, List, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { LabSummaryGrid } from '@/features/lab-results/components/LabSummaryGrid'
import { LabHistoryTable } from '@/features/lab-results/components/LabHistoryTable'
import { LabPanelForm } from '@/features/lab-results/components/LabPanelForm'
import {
  useLatestLabs,
  useLabHistory,
  useReferenceRanges,
  useCreateLabPanel,
} from '@/features/lab-results/hooks/useLabResults'
import { usePatient } from '@/features/patients/hooks/usePatient'
import type { CreateLabPanelForm } from '@/features/lab-results/types/lab.types'

type Tab = 'latest' | 'history'

export default function LabsPage() {
  const { id: patientId } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('latest')
  const [showForm, setShowForm] = useState(false)

  const { data: patientData } = usePatient(patientId)
  const { data: latestData, isLoading: latestLoading } = useLatestLabs(patientId)
  const { data: historyData, isLoading: historyLoading } = useLabHistory(patientId)
  const { data: refsData } = useReferenceRanges()
  const createPanel = useCreateLabPanel(patientId)

  const patient = patientData
  const latestPanel = latestData?.data ?? null
  const panels = historyData?.data ?? []
  const refRanges = refsData?.data ?? []

  const handleSubmit = async (data: CreateLabPanelForm) => {
    await createPanel.mutateAsync(data)
    setShowForm(false)
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'latest',  label: 'آخرین آزمایش‌ها', icon: FlaskConical },
    { id: 'history', label: 'تاریخچه',          icon: List         },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="آزمایش‌های بالینی"
        description={patient ? `بیمار: ${patient.full_name}` : ''}
        actions={
          <Button onClick={() => setShowForm(true)} leftIcon={<Plus className="w-4 h-4" />}>
            پنل جدید
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <motion.button
              key={t.id}
              onClick={() => setTab(t.id)}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === t.id
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-primary-100 hover:border-primary-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </motion.button>
          )
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === 'latest' ? (
          <motion.div
            key="latest"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <LabSummaryGrid panel={latestPanel} refRanges={refRanges} isLoading={latestLoading} />
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <LabHistoryTable panels={panels} patientId={patientId} isLoading={historyLoading} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="ثبت پنل آزمایشگاهی" size="xl">
        <LabPanelForm
          refRanges={refRanges}
          onSubmit={handleSubmit}
          isLoading={createPanel.isPending}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}