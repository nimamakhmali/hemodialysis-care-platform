'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesService } from '../services/messages.service'
import { QUERY_KEYS } from '@/lib/query/queryClient'
import toast from 'react-hot-toast'

export function useMessages(
  patientId: string,
  params?: { page?: number; size?: number }
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.messages(patientId), params],
    queryFn: () => messagesService.getMessages(patientId, params),
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useUnreadCount(patientId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.unreadCount(patientId),
    queryFn: () => messagesService.getUnreadCount(patientId),
    enabled: !!patientId,
    refetchInterval: 60_000,
  })
}

export function useMarkRead(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (messageId: string) => messagesService.markRead(messageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.messages(patientId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount(patientId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.patientDashboard(patientId) })
    },
  })
}

export function useMarkAllRead(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => messagesService.markAllRead(patientId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.messages(patientId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount(patientId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.patientDashboard(patientId) })
      toast.success('همه پیام‌ها خوانده شدند')
    },
  })
}