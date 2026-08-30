// src/features/dialysis-sessions/components/SessionList.tsx
'use client'

import { motion, AnimatePresence } from 'motion/react'
import { Calendar } from 'lucide-react'
import { SessionCard } from './SessionCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import type { DialysisSession } from '../types/session.types'

interface Props {
  sessions: DialysisSession[]
  patientId: string
  isLoading?: boolean
}

export function SessionList({ sessions, patientId, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (!sessions.length) {
    return (
      <EmptyState
        icon={<Calendar className="w-10 h-10 text-primary-300" />}
        title="جلسه‌ای ثبت نشده"
        description="اولین جلسه دیالیز را ثبت کنید"
      />
    )
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {sessions.map((session, index) => (
          <SessionCard
            key={session.id}
            session={session}
            patientId={patientId}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}