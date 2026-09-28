'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recommendationsService } from '../services/recommendations.service'
import { QUERY_KEYS } from '@/lib/query/queryClient'
import toast from 'react-hot-toast'
import type { ApprovePayload, RejectPayload } from '../services/recommendations.service'

export function usePendingRecommendations() {
  return useQuery({
    queryKey: QUERY_KEYS.pendingRecommendations,
    queryFn: recommendationsService.getPending,
    staleTime: 60_000,
    refetchInterval: 2 * 60_000,
  })
}

export function usePatientRecommendations(
  patientId: string,
  params?: { page?: number; size?: number }
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.recommendations(patientId), params],
    queryFn: () =>
      recommendationsService.getPatientRecommendations(patientId, params),
    enabled: !!patientId,
    staleTime: 60_000,
  })
}

export function useApproveRecommendation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      recId,
      payload,
    }: {
      recId: string
      payload?: ApprovePayload
    }) => recommendationsService.approve(recId, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.pendingRecommendations })
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.recommendations(data.patient_id),
      })
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.clinicianDashboard] })
      toast.success('توصیه تأیید شد و برای بیمار ارسال شد')
    },
    onError: () => toast.error('خطا در تأیید توصیه'),
  })
}

export function useRejectRecommendation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      recId,
      payload,
    }: {
      recId: string
      payload: RejectPayload
    }) => recommendationsService.reject(recId, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.pendingRecommendations })
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.recommendations(data.patient_id),
      })
      toast.success('توصیه رد شد')
    },
    onError: () => toast.error('خطا در رد توصیه'),
  })
}