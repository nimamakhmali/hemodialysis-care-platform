'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { labsService } from '../services/labs.service'
import { QUERY_KEYS } from '@/lib/query/queryClient'
import toast from 'react-hot-toast'
import type { CreateLabPanelRequest } from '../types/lab.types'

export function useLabPanels(
  patientId: string,
  params?: { page?: number; size?: number }
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.labHistory(patientId), params],
    queryFn: () => labsService.getPanels(patientId, params),
    enabled: !!patientId,
    staleTime: 3 * 60 * 1000,
  })
}

export function useLatestLabs(patientId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.latestLabs(patientId),
    queryFn: () => labsService.getLatest(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useLabPanel(patientId: string, panelId: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.labHistory(patientId), panelId],
    queryFn: () => labsService.getPanel(patientId, panelId),
    enabled: !!patientId && !!panelId,
  })
}

export function useLabTrend(patientId: string, testCode: string) {
  return useQuery({
    queryKey: QUERY_KEYS.labTrend(patientId, testCode),
    queryFn: () => labsService.getTrend(patientId, testCode),
    enabled: !!patientId && !!testCode,
    staleTime: 5 * 60 * 1000,
  })
}

export function useReferenceRanges() {
  return useQuery({
    queryKey: [QUERY_KEYS.referenceRanges],
    queryFn: labsService.getReferenceRanges,
    staleTime: 60 * 60 * 1000, // 1 hour — داده ثابت
  })
}

export function useCreateLabPanel(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateLabPanelRequest) =>
      labsService.createPanel(patientId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.latestLabs(patientId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.labHistory(patientId) })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.patientDashboard(patientId) })
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.clinicianDashboard] })
      toast.success('نتایج آزمایش با موفقیت ثبت شد')
    },
    onError: () => {
      toast.error('خطا در ثبت نتایج آزمایش')
    },
  })
}