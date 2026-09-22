'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsService } from '../services/sessions.service'
import { QUERY_KEYS } from '@/lib/query/queryClient'
import toast from 'react-hot-toast'
import type { SessionFormData } from '../types/session.types'

export function useSessions(
  patientId: string,
  params?: { page?: number; size?: number }
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.sessions(patientId), params],
    queryFn: () => sessionsService.getSessions(patientId, params),
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useSession(patientId: string, sessionId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.session(patientId, sessionId),
    queryFn: () => sessionsService.getSession(patientId, sessionId),
    enabled: !!patientId && !!sessionId,
  })
}

export function useCreateSession(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SessionFormData) =>
      sessionsService.createSession(patientId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sessions(patientId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.patient(patientId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.patientDashboard(patientId) })
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.clinicianDashboard] })
      toast.success('جلسه دیالیز با موفقیت ثبت شد')
    },
    onError: () => {
      toast.error('خطا در ثبت جلسه دیالیز')
    },
  })
}

export function useUpdateSession(patientId: string, sessionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<SessionFormData>) =>
      sessionsService.updateSession(patientId, sessionId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.session(patientId, sessionId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sessions(patientId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.weightTrend(patientId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.bpTrend(patientId) })
      toast.success('جلسه با موفقیت ویرایش شد')
    },
    onError: () => toast.error('خطا در ویرایش جلسه'),
  })
}

export function useWeightTrend(patientId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.weightTrend(patientId),
    queryFn: () => sessionsService.getWeightTrend(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useBPTrend(patientId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.bpTrend(patientId),
    queryFn: () => sessionsService.getBPTrend(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  })
}