'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  ArrowRight, User, Phone, Shield, Calendar,
  CheckCircle2, XCircle, Key, AlertTriangle
} from 'lucide-react'
import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { QUERY_KEYS } from '@/lib/query/queryClient'
import { PageLoader } from '@/components/feedback/PageLoader'
import { pageVariants } from '@/lib/animation/variants'
import { formatDate, formatDateTime } from '@/lib/utils/date.utils'
import { USER_ROLE_FA } from '@/config/constants'
import { Modal } from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import type { UserItem, ApiResponse } from '@/types/api.types'

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const qc = useQueryClient()
  const [showResetModal, setShowResetModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)

  const { data: user, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.adminUser(id),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<UserItem>>(
        API_ENDPOINTS.admin.users.detail(id)
      )
      return res.data.data
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async (activate: boolean) => {
      const endpoint = activate
        ? API_ENDPOINTS.admin.users.activate(id)
        : API_ENDPOINTS.admin.users.deactivate(id)
      await apiClient.post(endpoint)
    },
    onSuccess: (_, activate) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.adminUser(id) })
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.adminUsers] })
      toast.success(activate ? 'کاربر فعال شد' : 'کاربر غیرفعال شد')
      setShowDeactivateModal(false)
    },
    onError: () => toast.error('خطا در تغییر وضعیت'),
  })

  if (isLoading) return <PageLoader />

  if (isError || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-slate-500">کاربر یافت نشد</p>
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
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5 max-w-2xl mx-auto"
    >
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0EA5E9]"
      >
        <ArrowRight className="h-4 w-4" />
        بازگشت
      </button>

      {/* Header Card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] text-xl font-bold text-white shrink-0">
            {user.full_name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-800">
              {user.full_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  user.role === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : user.role === 'clinician'
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {USER_ROLE_FA[user.role]}
              </span>
              {user.is_active ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  فعال
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <XCircle className="h-3.5 w-3.5" />
                  غیرفعال
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          اطلاعات حساب
        </h3>

        <InfoRow
          icon={<Phone className="h-4 w-4" />}
          label="شماره موبایل"
          value={user.phone_number}
          ltr
        />
        <InfoRow
          icon={<Shield className="h-4 w-4" />}
          label="نقش"
          value={USER_ROLE_FA[user.role]}
        />
        <InfoRow
          icon={<Calendar className="h-4 w-4" />}
          label="تاریخ عضویت"
          value={formatDate(user.created_at)}
        />
        {user.last_login && (
          <InfoRow
            icon={<Calendar className="h-4 w-4" />}
            label="آخرین ورود"
            value={formatDateTime(user.last_login)}
          />
        )}
        {user.patient_profile?.patient_id && (
          <InfoRow
            icon={<User className="h-4 w-4" />}
            label="شناسه بیمار"
            value={user.patient_profile.patient_id}
            ltr
          />
        )}
      </div>

      {/* Actions */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          عملیات
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-2 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] px-4 py-2.5 text-sm font-medium text-[#0284C7] hover:bg-[#E0F2FE]"
          >
            <Key className="h-4 w-4" />
            بازنشانی رمز عبور
          </button>

          <button
            onClick={() => setShowDeactivateModal(true)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium ${
              user.is_active
                ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
            }`}
          >
            {user.is_active ? (
              <>
                <XCircle className="h-4 w-4" />
                غیرفعال کردن
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                فعال کردن
              </>
            )}
          </button>
        </div>
      </div>

      {/* Reset Password Modal */}
      <PasswordResetModal
        userId={id}
        userName={user.full_name}
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
      />

      {/* Deactivate Confirm Modal */}
      <Modal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title={user.is_active ? 'غیرفعال کردن کاربر' : 'فعال کردن کاربر'}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700">
              {user.is_active
                ? `آیا از غیرفعال کردن حساب ${user.full_name} مطمئن هستید؟ این کاربر دیگر نمی‌تواند وارد سیستم شود.`
                : `آیا از فعال کردن حساب ${user.full_name} مطمئن هستید؟`}
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowDeactivateModal(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              انصراف
            </button>
            <button
              onClick={() => toggleActiveMutation.mutate(!user.is_active)}
              disabled={toggleActiveMutation.isPending}
              className={`rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
                user.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              {toggleActiveMutation.isPending ? 'در حال اجرا...' : 'تأیید'}
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

// ── Secure password reset ─────────────────────────────────────────────────
function PasswordResetModal({
  userId,
  userName,
  isOpen,
  onClose,
}: {
  userId: string
  userName: string
  isOpen: boolean
  onClose: () => void
}) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isPending, setIsPending] = useState(false)

  const validate = () => {
    if (newPassword.length < 8) {
      setError('رمز باید حداقل ۸ کاراکتر باشد')
      return false
    }
    if (!/[0-9]/.test(newPassword)) {
      setError('رمز باید حداقل یک عدد داشته باشد')
      return false
    }
    if (!/[a-zA-Z]/.test(newPassword)) {
      setError('رمز باید حداقل یک حرف لاتین داشته باشد')
      return false
    }
    if (newPassword !== confirmPassword) {
      setError('رمزها با هم مطابقت ندارند')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    setError('')
    if (!validate()) return

    setIsPending(true)
    try {
      await apiClient.post(API_ENDPOINTS.admin.users.resetPassword(userId), {
        new_password: newPassword,
      })
      toast.success('رمز عبور با موفقیت تغییر کرد')
      setNewPassword('')
      setConfirmPassword('')
      onClose()
    } catch {
      setError('خطا در تغییر رمز عبور')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`تغییر رمز — ${userName}`}
      size="sm"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-700">
            رمز جدید را انتخاب کنید. کاربر باید پس از ورود رمز را تغییر دهد.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-600">
            رمز عبور جدید
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setError('') }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-[#0EA5E9] focus:outline-none"
            placeholder="حداقل ۸ کاراکتر"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-600">
            تکرار رمز عبور
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-[#0EA5E9] focus:outline-none"
            placeholder="رمز را تکرار کنید"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !newPassword || !confirmPassword}
            className="rounded-xl bg-[#0EA5E9] px-4 py-2 text-sm font-medium text-white hover:bg-[#0284C7] disabled:opacity-60"
          >
            {isPending ? 'در حال ذخیره...' : 'ذخیره رمز جدید'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function InfoRow({
  icon,
  label,
  value,
  ltr = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  ltr?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span
        className={`text-sm font-medium text-slate-800 ${ltr ? 'font-mono' : ''}`}
        dir={ltr ? 'ltr' : 'rtl'}
      >
        {value}
      </span>
    </div>
  )
}