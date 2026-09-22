'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Edit3 } from 'lucide-react'
import { usePatient } from '@/features/patients/hooks/usePatients'
import { PatientProfile } from '@/features/patients/components/PatientProfile'
import { PageLoader } from '@/components/feedback/PageLoader'
import { Modal } from '@/components/ui/Modal'
import { PatientForm } from '@/features/patients/components/PatientForm'
import { useState } from 'react'

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)
  const { data, isLoading, isError } = usePatient(id)

  if (isLoading) return <PageLoader />

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-slate-500">بیمار یافت نشد</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-[#0EA5E9]"
        >
          بازگشت
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Back + Edit */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0EA5E9]"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت
        </button>
        <button
          onClick={() => setShowEdit(true)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-[#0EA5E9] hover:text-[#0EA5E9] shadow-sm"
        >
          <Edit3 className="h-3.5 w-3.5" />
          ویرایش
        </button>
      </div>

      <PatientProfile patient={data} />

      {showEdit && (
        <Modal
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          title="ویرایش اطلاعات بیمار"
          size="lg"
        >
          <PatientForm
            initialData={data}
            onSuccess={() => setShowEdit(false)}
            onCancel={() => setShowEdit(false)}
          />
        </Modal>
      )}
    </div>
  )
}