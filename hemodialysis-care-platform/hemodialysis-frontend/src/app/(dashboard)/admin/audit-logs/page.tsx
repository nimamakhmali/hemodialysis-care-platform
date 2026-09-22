'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { FileText, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { QUERY_KEYS } from '@/lib/query/queryClient'
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { pageVariants } from '@/lib/animation/variants'
import { formatDateTime } from '@/lib/utils/date.utils'
import type { AuditLogItem } from '@/types/api.types'
import type { PaginatedApiResponse } from '@/types/api.types'
import { useDebounce } from '@/hooks/useDebounce'

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-purple-100 text-purple-700',
  LOGOUT: 'bg-slate-100 text-slate-600',
  APPROVE: 'bg-teal-100 text-teal-700',
  REJECT: 'bg-orange-100 text-orange-700',
}

function useAuditLogs(params: {
  page: number
  search?: string
  action?: string
}) {
  return useQuery({
    queryKey: [QUERY_KEYS.auditLogs, params],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedApiResponse<AuditLogItem>>(
        API_ENDPOINTS.admin.auditLogs.list,
        { params }
      )
      return res.data
    },
    staleTime: 60_000,
  })
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, isError } = useAuditLogs({
    page,
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
        title="لاگ‌های سیستم"
        description="تاریخچه کامل رویدادهای سیستم"
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در لاگ‌ها..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-10 pl-4 text-sm shadow-sm focus:border-[#0EA5E9] focus:outline-none"
        />
      </div>

      {/* Table */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-center text-sm text-red-500 py-8">
          خطا در دریافت لاگ‌ها
        </p>
      )}

      {!isLoading && !isError && (data?.data?.length ?? 0) === 0 && (
        <EmptyState
          icon={<FileText />}
          title="لاگی یافت نشد"
        />
      )}

      {!isLoading && !isError && (data?.data?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/60">
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                    زمان
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                    کاربر
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                    عملیات
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                    موجودیت
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data!.data.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-700">
                      {log.user_name ?? log.user_id ?? 'سیستم'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-600'}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {log.entity_type}
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="font-mono text-[10px]">
                        {log.entity_id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">
                      {log.ip_address ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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