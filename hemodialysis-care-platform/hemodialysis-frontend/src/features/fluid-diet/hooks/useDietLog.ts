'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dietService } from '../services/diet.service'
import { QUERY_KEYS } from '@/lib/query/queryClient'
import toast from 'react-hot-toast'
import type { UpsertDietLogRequest } from '../types/fluid-diet.types'

export function useDietHistory(
  patientId: string,
  params?: { page?: number; size?: number }
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.dietHistory(patientId), params],
    queryFn: () => dietService.getHistory(patientId, params),
    enabled: !!patientId,
    staleTime: 3 * 60 * 1000,
  })
}

export function useDietSummary(patientId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.dietSummary(patientId),
    queryFn: () => dietService.getSummary(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpsertDietLog(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpsertDietLogRequest) =>
      dietService.upsert(patientId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dietHistory(patientId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dietSummary(patientId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.patientDashboard(patientId) })
      toast.success('رژیم غذایی ثبت شد')
    },
    onError: () => {
      toast.error('خطا در ثبت رژیم غذایی')
    },
  })
}