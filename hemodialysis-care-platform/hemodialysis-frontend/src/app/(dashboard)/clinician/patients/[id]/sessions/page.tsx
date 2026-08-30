// src/app/(dashboard)/clinician/patients/[id]/sessions/page.tsx
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { SessionList } from '@/features/dialysis-sessions/components/SessionList'
import { SessionForm } from '@/features/dialysis-sessions/components/SessionForm'
import { WeightTrendChart } from '@/features/dialysis-sessions/components/WeightTrendChart'
import { BPTrendChart } from '@/features/dialysis-sessions/components/BPTrendChart'
import {
  useSessions,
  useCreateSession,
  useWeightTrend,
  useBPTrend,
} from '@/features/dialysis-sessions/hooks/useSessions'
import { usePatient } from '@/features/patients/hooks/usePatient'

export default function SessionsPage() {
  const { id: patientId } = useParams<{ id: string }>()
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'trends'>('list')

  const { data: patientData } = usePatient(patientId)
  const { data: sessionsData, isLoading } = useSessions(patientId)
  const { data: weightTrendData } = useWeightTrend(patientId)
  const { data: bpTrendData } = useBPTrend(patientId)
  const createSession = useCreateSession(patientId)

  const patient = patientData
  const sessions = sessionsData?.data ?? []
  const weightChart = weightTrendData?.data?.weight_chart ?? []
  const bpChart = bpTrendData?.data?.bp_chart ?? []

  const handleSubmit = async (data: any) => {
    await createSession.mutateAsync(data)
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="جلسات دیالیز"
        description={patient ? `بیمار: ${patient.full_name}` : ''}
        actions={
          <Button
            onClick={() => setShowForm(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            جلسه جدید
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'list', label: 'لیست جلسات' },
          { id: 'trends', label: 'نمودار روند' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'list' | 'trends')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-white text-text-secondary border border-primary-100 hover:border-primary-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <SessionList
              sessions={sessions}
              patientId={patientId}
              isLoading={isLoading}
            />
          </motion.div>
        ) : (
          <motion.div
            key="trends"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 gap-5"
          >
            <WeightTrendChart
              data={weightChart}
              dryWeight={patient?.dry_weight}
            />
            <BPTrendChart data={bpChart} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal فرم جلسه */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="ثبت جلسه دیالیز"
        size="lg"
      >
        <SessionForm
          dryWeight={patient?.dry_weight ?? 70}
          onSubmit={handleSubmit}
          isLoading={createSession.isPending}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}