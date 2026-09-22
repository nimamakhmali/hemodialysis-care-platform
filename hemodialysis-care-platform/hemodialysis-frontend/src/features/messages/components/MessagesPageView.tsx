'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { MessageSquare, CheckCheck, BookOpen } from 'lucide-react'
import { useMessages, useMarkRead, useMarkAllRead } from '../hooks/useMessages'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDateTime } from '@/lib/utils/date.utils'
import { pageVariants } from '@/lib/animation/variants'
import type { PatientMessageItem } from '@/types/api.types'

interface MessagesPageViewProps {
  patientId: string
}

export function MessagesPageView({ patientId }: MessagesPageViewProps) {
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<PatientMessageItem | null>(null)

  const { data, isLoading, isError } = useMessages(patientId, { page, size: 10 })
  const { mutate: markRead } = useMarkRead(patientId)
  const { mutate: markAllRead, isPending: markingAll } = useMarkAllRead(patientId)

  const messages = data?.data ?? []
  const unreadCount = messages.filter((m) => !m.read_at).length

  const handleOpen = (msg: PatientMessageItem) => {
    setSelected(msg)
    if (!msg.read_at) {
      markRead(msg.id)
    }
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      <PageHeader
        title="پیام‌های تیم درمان"
        description="پیام‌ها و توصیه‌های تأییدشده توسط پزشک"
        action={
          unreadCount > 0 ? (
            <button
              onClick={() => markAllRead()}
              disabled={markingAll}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" />
              خواندن همه
            </button>
          ) : undefined
        }
      />

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-center text-sm text-red-500 py-6">
          خطا در دریافت پیام‌ها
        </p>
      )}

      {!isLoading && !isError && messages.length === 0 && (
        <EmptyState
          icon={<MessageSquare />}
          title="پیامی وجود ندارد"
          description="تیم درمانی هنوز پیامی برای شما ارسال نکرده است"
        />
      )}

      {!isLoading && !isError && messages.length > 0 && (
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleOpen(msg)}
              className={`
                cursor-pointer rounded-2xl border p-4 shadow-sm transition-all
                hover:shadow-md
                ${
                  !msg.read_at
                    ? 'border-primary-200 bg-primary-50'
                    : 'border-slate-100 bg-white'
                }
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {!msg.read_at && (
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        !msg.read_at ? 'text-primary-800' : 'text-slate-800'
                      } truncate`}
                    >
                      {msg.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {msg.content}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {formatDateTime(msg.sent_at)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.pages}
          onPageChange={setPage}
        />
      )}

      {/* Message detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
            >
              <div className="border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary-500" />
                  <h2 className="font-semibold text-slate-800 text-sm">
                    {selected.title}
                  </h2>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {formatDateTime(selected.sent_at)}
                </p>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selected.content}
                </p>
              </div>
              <div className="border-t border-slate-100 px-6 py-4">
                <button
                  onClick={() => setSelected(null)}
                  className="w-full rounded-xl bg-primary-500 py-2.5 text-sm font-medium text-white hover:bg-primary-600"
                >
                  بستن
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}