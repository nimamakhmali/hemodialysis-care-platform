'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  CheckCircle,
  XCircle,
  Edit3,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'
import type { Recommendation } from '../types/recommendation.types'

interface RecommendationReviewModalProps {
  recommendation: Recommendation
  onClose: () => void
  onApprove: (patientContent?: string) => Promise<void>
  onReject: (reason: string) => Promise<void>
  isApproving: boolean
  isRejecting: boolean
}

type Tab = 'draft' | 'patient_message' | 'evidence'

export function RecommendationReviewModal({
  recommendation: rec,
  onClose,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: RecommendationReviewModalProps) {
  const [tab, setTab] = useState<Tab>('draft')
  const [patientContent, setPatientContent] = useState(
    rec.patient_content ?? ''
  )
  const [isEditing, setIsEditing] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const isProcessing = isApproving || isRejecting

  const handleApprove = async () => {
    await onApprove(patientContent || undefined)
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    await onReject(rejectReason.trim())
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="font-semibold text-slate-800">
                بررسی توصیه بالینی
              </h2>
              {rec.patient_name && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {rec.patient_name}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          {/* ⚠️ Medical Safety Notice */}
          <div className="mx-6 mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              این توصیه یک{' '}
              <strong>پیشنهاد سیستم هوشمند</strong> است. تصمیم نهایی با
              پزشک است. متن ارسالی به بیمار را پیش از تأیید بررسی کنید.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-100 px-6 mt-4">
            {(
              [
                { key: 'draft', label: 'پیشنهاد سیستم' },
                { key: 'patient_message', label: 'پیام به بیمار' },
              ] as { key: Tab; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`
                  px-4 py-2.5 text-xs font-medium border-b-2 transition-all
                  ${
                    tab === key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {tab === 'draft' && (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {rec.draft_for_clinician}
                  </p>
                </div>
              </div>
            )}

            {tab === 'patient_message' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-600">
                    متنی که به بیمار ارسال می‌شود:
                  </p>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600"
                  >
                    <Edit3 className="h-3 w-3" />
                    {isEditing ? 'بستن ویرایش' : 'ویرایش'}
                  </button>
                </div>

                {isEditing ? (
                  <textarea
                    value={patientContent}
                    onChange={(e) => setPatientContent(e.target.value)}
                    rows={8}
                    placeholder="متن پیامی که به بیمار ارسال می‌شود..."
                    className="w-full rounded-xl border border-primary-200 bg-primary-50/30 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
                  />
                ) : (
                  <div className="rounded-xl bg-primary-50 border border-primary-100 p-4 min-h-[8rem]">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {patientContent || (
                        <span className="text-slate-400 italic">
                          محتوایی برای بیمار تعریف نشده
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reject form */}
          <AnimatePresence>
            {showRejectForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-slate-100"
              >
                <div className="p-4 space-y-2">
                  <p className="text-xs font-medium text-red-600">
                    دلیل رد توصیه:
                  </p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    placeholder="دلیل را وارد کنید..."
                    className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                  />
                  <button
                    onClick={handleReject}
                    disabled={!rejectReason.trim() || isProcessing}
                    className="w-full rounded-xl bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    {isRejecting ? 'در حال رد...' : 'تأیید رد'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
            <button
              onClick={() => setShowRejectForm(!showRejectForm)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              رد توصیه
            </button>

            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
            >
              <CheckCircle className="h-4 w-4" />
              {isApproving ? 'در حال تأیید...' : 'تأیید و ارسال به بیمار'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}