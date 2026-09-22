'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { BookOpen, Search } from 'lucide-react'
import { useEducationList } from '@/features/education/hooks/useEducation'
import { useRequirePatientId } from '@/features/auth/hooks/useRequirePatientId'
import { EducationCard } from '@/features/education/components/EducationCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoader } from '@/components/feedback/PageLoader'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { pageVariants } from '@/lib/animation/variants'
import { useDebounce } from '@/hooks/useDebounce'

export default function PatientEducationPage() {
  const { patientId, isReady } = useRequirePatientId()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useEducationList({
    search: debouncedSearch || undefined,
    size: 20,
  })

  if (!isReady) return <PageLoader />

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      <PageHeader
        title="مطالب آموزشی"
        description="محتوای آموزشی مرتبط با درمان دیالیز"
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در مطالب..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-10 pl-4 text-sm shadow-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && (data?.data?.length ?? 0) === 0 && (
        <EmptyState
          icon={<BookOpen />}
          title="مطلبی یافت نشد"
          description="هنوز محتوای آموزشی اضافه نشده است"
        />
      )}

      {!isLoading && (data?.data?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data!.data.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <EducationCard item={item} />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}