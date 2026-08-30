// src/features/lab-results/hooks/useLabResults.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { labsService } from '../services/labs.service'
import type { CreateLabPanelForm } from '../types/lab.types'
import toast from 'react-hot-toast'

const KEYS = {
  latest: (pid: string) => ['labs', pid, 'latest'],
  history: (pid: string, params?: object) => ['labs', pid, 'history', params],
  panel: (pid: string, panelId: string) => ['labs', pid, 'panel', panelId],
  trend: (pid: string, code: string) => ['labs', pid, 'trend', code],
  refs: () => ['labs', 'reference-ranges'],
}

export function useLatestLabs(patientId: string) {
  return useQuery({
    queryKey: KEYS.latest(patientId),
    queryFn: () => labsService.getLatestLabs(patientId),
    enabled: !!patientId,
    staleTime: 3 * 60 * 1000,
  })
}

export function useLabHistory(patientId: string, params?: { page?: number; size?: number; test_code?: string }) {
  return useQuery({
    queryKey: KEYS.history(patientId, params),
    queryFn: () => labsService.getHistory(patientId, params),
    enabled: !!patientId,
    staleTime: 3 * 60 * 1000,
    placeholderData: (prev: any) => prev,
  })
}

export function useLabPanelDetail(patientId: string, panelId: string) {
  return useQuery({
    queryKey: KEYS.panel(patientId, panelId),
    queryFn: () => labsService.getPanelDetail(patientId, panelId),
    enabled: !!patientId && !!panelId,
  })
}

export function useLabTrend(patientId: string, testCode: string) {
  return useQuery({
    queryKey: KEYS.trend(patientId, testCode),
    queryFn: () => labsService.getTrend(patientId, testCode),
    enabled: !!patientId && !!testCode,
    staleTime: 5 * 60 * 1000,
  })
}

export function useReferenceRanges() {
  return useQuery({
    queryKey: KEYS.refs(),
    queryFn: () => labsService.getReferenceRanges(),
    staleTime: 60 * 60 * 1000,
  })
}

export function useCreateLabPanel(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateLabPanelForm) => labsService.createPanel(patientId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labs', patientId] })
      qc.invalidateQueries({ queryKey: ['patients', patientId] })
      toast.success('نتایج آزمایش با موفقیت ثبت شد')
    },
    onError: () => toast.error('خطا در ثبت آزمایش'),
  })
}