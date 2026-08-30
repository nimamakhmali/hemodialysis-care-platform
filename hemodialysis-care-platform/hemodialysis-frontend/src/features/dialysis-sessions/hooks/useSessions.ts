// src/features/dialysis-sessions/hooks/useSessions.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsService } from '../services/sessions.service'
import { QUERY_KEYS } from '@/lib/query/queryClient'
import toast from 'react-hot-toast'

export function useSessions(patientId: string, params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: [QUERY_KEYS.sessions, patientId, params],
    queryFn: () => sessionsService.getSessions(patientId, params),
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useSession(patientId: string, sessionId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.sessions, patientId, sessionId],
    queryFn: () => sessionsService.getSession(patientId, sessionId),
    enabled: !!patientId && !!sessionId,
  })
}

export function useCreateSession(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => sessionsService.createSession(patientId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.sessions, patientId] })
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.patients, patientId] })
      toast.success('جلسه دیالیز با موفقیت ثبت شد')
    },
    onError: () => {
      toast.error('خطا در ثبت جلسه دیالیز')
    },
  })
}

export function useWeightTrend(patientId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.sessions, patientId, 'weight-trend'],
    queryFn: () => sessionsService.getWeightTrend(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useBPTrend(patientId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.sessions, patientId, 'bp-trend'],
    queryFn: () => sessionsService.getBPTrend(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  })
}