'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fluidService } from '../services/fluid.service'
import { QUERY_KEYS } from '@/lib/query/queryClient'
import toast from 'react-hot-toast'
import type { UpsertFluidLogRequest } from '../types/fluid-diet.types'

export function useFluidHistory(
  patientId: string,
  params?: { page?: number; size?: number }
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.fluidHistory(patientId), params],
    queryFn: () => fluidService.getHistory(patientId, params),
    enabled: !!patientId,
    staleTime: 3 * 60 * 1000,
  })
}

export function useUpsertFluidLog(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpsertFluidLogRequest) =>
      fluidService.upsert(patientId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.fluidHistory(patientId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.patientDashboard(patientId) })
      toast.success('مصرف مایعات ثبت شد')
    },
    onError: () => {
      toast.error('خطا در ثبت مایعات')
    },
  })
}