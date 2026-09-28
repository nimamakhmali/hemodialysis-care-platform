'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2, XCircle, Edit3, AlertTriangle, User } from 'lucide-react'
import { useApproveRecommendation, useRejectRecommendation } from '../hooks/useRecommendations'
import type { RecommendationItem } from '@/types/api.types'
import { ALERT_SEVERITY_COLORS } from '@/config/constants'
import { formatDateTime } from '@/lib/utils/date.utils'
import { Modal } from '@/components/ui/Modal'

interface Props {
  recommendation: RecommendationItem
  isOpen: boolean
  onClose: () => void
}

type Mode = 'view' | 'approve' | 'reject'

export function RecommendationReviewModal({
  recommendation: rec,
  isOpen,
  onClose,
}: Props) {
  const [mode, setMode] = useState<Mode>('view')
  const [editedContent, setEditedContent] = useState(
    rec.patient_content ?? ''
  )
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState('')

  const approveMutation = useApproveRecommendation()
  const rejectMutation = useRejectRecommendation()

  const cfg = ALERT_SEVERITY_COLORS[rec.priority]

  const handleApprove = async () => {
    await approveMutation.mutateAsync({
      recId: rec.id,
      payload: editedContent.trim()
        ? { patient_content: editedContent.trim() }
        : undefined,
    })
    onClose()
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError('دلیل رد الزامی است')
      return
    }
    await rejectMutation.mutateAsync({
      recId: rec.id,
      payload: { reason: rejectReason.trim() },
    })
    onClose()
  }

  const isProcessing = approveMutation.isPending || rejectMutation.isPending

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="بررسی توصیه"
      size="lg"
      preventClose={isProcessing}
    >
      <div className="space-y-5">
        {/* Meta */}
        <div className="flex items-center gap-3">
          {rec.patient_name && (
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <User className="h-4 w-4 text-slate-400" />
              {rec.patient_name}
            </div>
          )}
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg.badge}`}
          >
            {rec.priority === 'high'
              ? 'بحرانی'
              : rec.priority === 'medium'
              ? 'متوسط'
              : 'کم'}
          </span>
          <span className="text-[11px] text-slate-400">
            {formatDateTime(rec.created_at)}
          </span>
        </div>

        {/* Draft for clinician */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-500 mb-2">
            تحلیل سیستم (برای پزشک):
          </p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {rec.draft_for_clinician}
          </p>
        </div>

        {/* Patient content editor */}
        {(mode === 'view' || mode === 'approve') && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500">
                پیام برای بیمار:
              </p>
              {mode === 'view' && (
                <button
                  onClick={() => setMode('approve')}
                  className="flex items-center gap-1 text-[11px] text-[#0EA5E9] hover:text-[#0284C7]"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  ویرایش
                </button>
              )}
            </div>

            {mode === 'approve' ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={5}
                placeholder="متن پیام برای بیمار را وارد کنید..."
                className="w-full rounded-xl border border-[#BAE6FD] bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#0EA5E9] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/15 resize-none"
              />
            ) : (
              <div className="rounded-xl border border-slate-100 bg-white p-3">
                {rec.patient_content ? (
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {rec.patient_content}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic">
                    متنی برای بیمار تنظیم نشده
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reject reason */}
        {mode === 'reject' && (
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">
              دلیل رد:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value)
                setRejectError('')
              }}
              rows={3}
              placeholder="دلیل رد این توصیه را بنویسید..."
              className={`w-full rounded-xl border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 ${
                rejectError
                  ? 'border-red-300 bg-red-50 focus:ring-red-100'
                  : 'border-slate-200 bg-white focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/15'
              }`}
            />
            {rejectError && (
              <p className="text-xs text-red-500 mt-1">{rejectError}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {mode === 'view' && (
            <>
              <button
                onClick={() => setMode('reject')}
                className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100"
              >
                <XCircle className="h-4 w-4" />
                رد توصیه
              </button>
              <button
                onClick={() => setMode('approve')}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600"
              >
                <CheckCircle2 className="h-4 w-4" />
                تأیید و ارسال
              </button>
            </>
          )}

          {mode === 'approve' && (
            <>
              <button
                onClick={() => setMode('view')}
                disabled={isProcessing}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isProcessing ? 'در حال ارسال...' : 'تأیید و ارسال به بیمار'}
              </button>
            </>
          )}

          {mode === 'reject' && (
            <>
              <button
                onClick={() => setMode('view')}
                disabled={isProcessing}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                {isProcessing ? 'در حال رد...' : 'رد توصیه'}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}