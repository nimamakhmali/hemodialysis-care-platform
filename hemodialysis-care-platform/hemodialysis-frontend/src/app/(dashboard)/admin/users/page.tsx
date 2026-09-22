'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { Users, Search, Plus, CheckCircle2, XCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { QUERY_KEYS } from '@/lib/query/queryClient'
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { pageVariants } from '@/lib/animation/variants'
import { formatDate } from '@/lib/utils/date.utils'
import { USER_ROLE_FA } from '@/config/constants'
import type { UserItem, PaginatedApiResponse } from '@/types/api.types'
import type { UserRole } from '@/types/common.types'
import { useDebounce } from '@/hooks/useDebounce'
import toast from 'react-hot-toast'

const ROLE_BADGE: Record<UserRole, string> = {
  patient: 'bg-blue-100 text-blue-700',
  clinician: 'bg-teal-100 text-teal-700',
  admin: 'bg-purple-100 text-purple-700',
}

function useAdminUsers(params: { page: number; search?: string; role?: string }) {
  return useQuery({
    queryKey: [QUERY_KEYS.adminUsers, params],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedApiResponse<UserItem>>(
        API_ENDPOINTS.admin.users.list,
        { params }
      )
      return res.data
    },
    staleTime: 2 * 60 * 1000,
  })
}

export default function AdminUsersPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, isError } = useAdminUsers({
    page,
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const endpoint = active
        ? API_ENDPOINTS.admin.users.deactivate(id)
        : API_ENDPOINTS.admin.users.activate(id)
      await apiClient.post(endpoint)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.adminUsers] })
      toast.success('وضعیت کاربر تغییر کرد')
    },
    onError: () => toast.error('خطا در تغییر وضعیت'),
  })

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <PageHeader
        title="مدیریت کاربران"
        description="لیست تمام کاربران سیستم"
        action={
          <button
            onClick={() => router.push('/admin/users/new')}
            className="flex items-center gap-2 rounded-xl bg-[#0EA5E9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0284C7]"
          >
            <Plus className="h-4 w-4" />
            کاربر جدید
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی نام یا موبایل..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-4 text-sm focus:border-[#0EA5E9] focus:outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#0EA5E9] focus:outline-none"
        >
          <option value="">همه نقش‌ها</option>
          <option value="patient">بیمار</option>
          <option value="clinician">کلینیسین</option>
          <option value="admin">ادمین</option>
        </select>
      </div>

      {/* Table */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-center text-red-500 py-8 text-sm">خطا در دریافت کاربران</p>
      )}

      {!isLoading && !isError && (data?.data?.length ?? 0) === 0 && (
        <EmptyState icon={<Users />} title="کاربری یافت نشد" />
      )}

      {!isLoading && !isError && (data?.data?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/60">
                {['نام', 'موبایل', 'نقش', 'آخرین ورود', 'وضعیت', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data!.data.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-slate-50/50 cursor-pointer"
                  onClick={() => router.push(`/admin/users/${u.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {u.full_name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600" dir="ltr">
                    {u.phone_number}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_BADGE[u.role]}`}>
                      {USER_ROLE_FA[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {u.last_login ? formatDate(u.last_login) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> فعال
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <XCircle className="h-3.5 w-3.5" /> غیرفعال
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() =>
                        toggleActive.mutate({ id: u.id, active: u.is_active })
                      }
                      disabled={toggleActive.isPending}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        u.is_active
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      } disabled:opacity-50`}
                    >
                      {u.is_active ? 'غیرفعال' : 'فعال'}
                    </button>
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