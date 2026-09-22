'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import { usePatients } from '@/features/patients/hooks/usePatients'
import { PatientList } from '@/features/patients/components/PatientList'
import { PatientForm } from '@/features/patients/components/PatientForm'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { pageVariants } from '@/lib/animation/variants'
import { useDebounce } from '@/hooks/useDebounce'

export default function ClinicianPatientsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(true)
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = usePatients({
    page,
    size: 12,
    search: debouncedSearch || undefined,
    is_active: activeFilter,
  })

  const patients = data?.data ?? []

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      <PageHeader
        title="بیماران"
        description={`${data?.total ?? 0} بیمار در سیستم`}
        action={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-[#0EA5E9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0284C7]"
          >
            <Plus className="h-4 w-4" />
            بیمار جدید
          </button>
        }
      />

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="جستجوی نام، کد بیمارستانی..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-4 text-sm focus:border-[#0EA5E9] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 shadow-sm"
          />
        </div>

        <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {[
            { label: 'فعال', value: true },
            { label: 'همه', value: undefined },
            { label: 'غیرفعال', value: false },
          ].map((f) => (
            <button
              key={String(f.value)}
              onClick={() => {
                setActiveFilter(f.value)
                setPage(1)
              }}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                activeFilter === f.value
                  ? 'bg-[#0EA5E9] text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <PatientList
        patients={patients}
        isLoading={isLoading}
        totalCount={data?.total}
      />

      {/* Pagination */}
      {data && data.pages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.pages}
          onPageChange={setPage}
        />
      )}

      {/* New Patient Modal */}
      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title="ثبت بیمار جدید"
          size="lg"
        >
          <PatientForm
            onSuccess={(id) => {
              setShowForm(false)
              router.push(`/clinician/patients/${id}`)
            }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
    </motion.div>
  )
}