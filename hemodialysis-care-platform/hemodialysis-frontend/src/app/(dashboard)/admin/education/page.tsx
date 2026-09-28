'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { Plus, Search, BookOpen, Eye, EyeOff } from 'lucide-react'
import { useEducationList } from '@/features/education/hooks/useEducation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { pageVariants } from '@/lib/animation/variants'
import { useDebounce } from '@/hooks/useDebounce'

export default function AdminEducationPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useEducationList({
    page,
    size: 15,
    search: debouncedSearch || undefined,
  })

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <PageHeader
        title="مدیریت محتوای آموزشی"
        description="ایجاد و ویرایش مطالب آموزشی"
        action={
          <button
            onClick={() => router.push('/admin/education/new')}
            className="flex items-center gap-2 rounded-xl bg-[#0EA5E9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0284C7]"
          >
            <Plus className="h-4 w-4" />
            محتوای جدید
          </button>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در محتوا..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-10 pl-4 text-sm shadow-sm focus:border-[#0EA5E9] focus:outline-none"
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && (data?.data?.length ?? 0) === 0 && (
        <EmptyState
          icon={<BookOpen />}
          title="محتوایی یافت نشد"
        />
      )}

      {!isLoading && (data?.data?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/60">
                {['عنوان', 'کد موضوع', 'برچسب‌ها', 'وضعیت', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data!.data.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 cursor-pointer"
                  onClick={() =>
                    router.push(`/admin/education/${item.id}`)
                  }
                >
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {item.title_fa}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {item.topic_code}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#E0F2FE] px-2 py-0.5 text-[10px] text-[#0284C7]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {item.is_active ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-700">
                        <Eye className="h-3.5 w-3.5" />
                        فعال
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <EyeOff className="h-3.5 w-3.5" />
                        غیرفعال
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[#0EA5E9]">
                    ویرایش
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.pages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.pages}
          onPageChange={setPage}
        />
      )}
    </motion.div>
  )
}