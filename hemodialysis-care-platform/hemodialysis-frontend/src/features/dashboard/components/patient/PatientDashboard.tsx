'use client'

import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { Bell, BookOpen, MessageSquare, RefreshCw } from 'lucide-react'
import { usePatientDashboard } from '../../hooks/usePatientDashboard'
import { WeightStatusCard } from './WeightStatusCard'
import { BPStatusCard } from './BPStatusCard'
import { LabSummarySection } from './LabSummarySection'
import { RiskScoreCard } from './RiskScoreCard'
import { TodayTasksWidget } from './TodayTasksWidget'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDistanceToNow, formatShortDate } from '@/lib/utils/date.utils'

interface PatientDashboardProps {
  patientId: string
}

export function PatientDashboard({ patientId }: PatientDashboardProps) {
  const { data, isLoading, isError, refetch } = usePatientDashboard(patientId)

  if (isLoading) return <PatientDashboardSkeleton />

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-slate-500">خطا در دریافت اطلاعات داشبورد</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600"
        >
          <RefreshCw className="h-4 w-4" />
          تلاش مجدد
        </button>
      </div>
    )
  }

  if (!data) return null

  const { patient_info, weight_summary, bp_summary, lab_summary,
    recent_messages, unread_count, relevant_education, today_tasks } = data

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Greeting */}
      <div className="rounded-2xl bg-gradient-to-l from-primary-500 to-cyan-500 p-5 text-white">
        <p className="text-sm opacity-80">سلام،</p>
        <h1 className="text-xl font-bold mt-0.5">{patient_info.full_name}</h1>
        {patient_info.next_session_reminder && (
          <p className="text-sm opacity-80 mt-2">
            جلسه بعدی: {patient_info.next_session_reminder}
          </p>
        )}
      </div>

      {/* Today Tasks */}
      {today_tasks && <TodayTasksWidget tasks={today_tasks} />}

      {/* Vitals Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <WeightStatusCard weightSummary={weight_summary} />
        <BPStatusCard bpSummary={bp_summary} />
      </div>

      {/* Labs */}
      {lab_summary && Object.keys(lab_summary).length > 0 && (
        <LabSummarySection labSummary={lab_summary} />
      )}

      {/* Messages */}
      {(unread_count > 0 || recent_messages.length > 0) && (
        <MessagesSummaryCard
          messages={recent_messages}
          unreadCount={unread_count}
        />
      )}

      {/* Education */}
      {relevant_education && relevant_education.length > 0 && (
        <EducationSummaryCard items={relevant_education} />
      )}
    </motion.div>
  )
}

function MessagesSummaryCard({
  messages,
  unreadCount,
}: {
  messages: Array<{ id: string; title: string; sent_at: string; read_at?: string }>
  unreadCount: number
}) {
  const router = useRouter()

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary-500" />
          <h3 className="text-sm font-semibold text-slate-800">پیام‌ها</h3>
          {unreadCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={() => router.push('/patient/messages')}
          className="text-xs text-primary-500 hover:text-primary-600"
        >
          همه
        </button>
      </div>

      <div className="space-y-2">
        {messages.slice(0, 3).map((msg) => (
          <div
            key={msg.id}
            onClick={() => router.push('/patient/messages')}
            className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 cursor-pointer hover:bg-primary-50"
          >
            <div className="flex items-center gap-2 min-w-0">
              {!msg.read_at && (
                <div className="h-2 w-2 shrink-0 rounded-full bg-primary-500" />
              )}
              <span className="text-xs text-slate-700 truncate">{msg.title}</span>
            </div>
            <span className="text-[11px] text-slate-400 shrink-0 mr-2">
              {formatDistanceToNow(msg.sent_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EducationSummaryCard({
  items,
}: {
  items: Array<{ id: string; topic_code: string; title_fa: string }>
}) {
  const router = useRouter()

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary-500" />
          <h3 className="text-sm font-semibold text-slate-800">آموزش‌های مرتبط</h3>
        </div>
        <button
          onClick={() => router.push('/patient/education')}
          className="text-xs text-primary-500"
        >
          همه
        </button>
      </div>

      <div className="space-y-2">
        {items.slice(0, 3).map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(`/patient/education/${item.topic_code}`)}
            className="flex w-full items-center justify-between rounded-xl bg-primary-50 px-3 py-2.5 hover:bg-primary-100 transition-colors"
          >
            <span className="text-xs font-medium text-primary-700">
              {item.title_fa}
            </span>
            <span className="text-[11px] text-primary-400">مطالعه</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function PatientDashboardSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  )
}