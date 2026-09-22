'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Activity } from 'lucide-react'
import { useSymptomHistory } from '../hooks/useSymptoms'
import { SymptomReportForm } from './SymptomReportForm'
import { SymptomHistoryList } from './SymptomHistoryList'
import { PageHeader } from '@/components/layout/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { pageVariants } from '@/lib/animation/variants'

interface SymptomsPageViewProps {
  patientId: string
}

export function SymptomsPageView({ patientId }: SymptomsPageViewProps) {
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'report' | 'history'>('report')

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      <PageHeader
        title="ثبت علائم"
        description="علائم و عوارضی که احساس می‌کنید را ثبت کنید"
        action={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" />
            ثبت علائم جدید
          </button>
        }
      />

      <Tabs
        tabs={[
          { key: 'report', label: 'ثبت سریع' },
          { key: 'history', label: 'تاریخچه' },
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as 'report' | 'history')}
      />

      {activeTab === 'report' && (
        <SymptomReportForm
          patientId={patientId}
          onSuccess={() => setActiveTab('history')}
          inline
        />
      )}

      {activeTab === 'history' && (
        <SymptomHistoryList patientId={patientId} />
      )}

      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title="ثبت علائم"
        >
          <SymptomReportForm
            patientId={patientId}
            onSuccess={() => setShowForm(false)}
          />
        </Modal>
      )}
    </motion.div>
  )
}