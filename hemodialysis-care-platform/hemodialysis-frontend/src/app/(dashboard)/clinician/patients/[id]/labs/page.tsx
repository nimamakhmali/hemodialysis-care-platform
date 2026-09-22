'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Plus, FlaskConical } from 'lucide-react'
import { useLabPanels } from '@/features/lab-results/hooks/useLabResults'
import { LabSummaryGrid } from '@/features/lab-results/components/LabSummaryGrid'
import { LabHistoryTable } from '@/features/lab-results/components/LabHistoryTable'
import { LabPanelForm } from '@/features/lab-results/components/LabPanelForm'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoader } from '@/components/feedback/PageLoader'
import { Modal } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { pageVariants } from '@/lib/animation/variants'

export default function PatientLabsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'latest' | 'history'>('latest')

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <PageHeader
        title="آزمایش‌ها"
        description="نتایج و تاریخچه آزمایش‌های بیمار"
        action={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" />
            ثبت آزمایش جدید
          </button>
        }
      />

      <Tabs
        tabs={[
          { key: 'latest', label: 'آخرین نتایج' },
          { key: 'history', label: 'تاریخچه' },
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as 'latest' | 'history')}
      />

      {activeTab === 'latest' && <LabSummaryGrid patientId={id} />}
      {activeTab === 'history' && <LabHistoryTable patientId={id} />}

      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title="ثبت پنل آزمایش جدید"
          size="lg"
        >
          <LabPanelForm
            patientId={id}
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
    </motion.div>
  )
}