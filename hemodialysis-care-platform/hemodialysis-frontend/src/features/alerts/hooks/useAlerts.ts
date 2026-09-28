'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { QUERY_KEYS } from '@/lib/query/queryClient'
import toast from 'react-hot-toast'
import type { AlertItem, PaginatedApiResponse, ApiResponse } from '@/types/api.types'
import type { AlertStatus, AlertSeverity } from '@/types/common.types'

interface AlertFilters {
  status?: AlertStatus
  severity?: AlertSeverity
  page?: number
  size?: number
}

// ── All alerts (clinician/admin) ────────────────────────────────────────────
export function useAllAlerts(filters?: AlertFilters) {
  return useQuery({
    queryKey: [...QUERY_KEYS.allAlerts, filters],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedApiResponse<AlertItem>>(
        API_ENDPOINTS.alerts.all,
        { params: filters }
      )
      return res.data
    },
    staleTime: 60_000,
    refetchInterval: 2 * 60_000,
  })
}

export function useAllAlertsCount(enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEYS.allAlerts, 'count'],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedApiResponse<AlertItem>>(
        API_ENDPOINTS.alerts.all,
        { params: { status: 'new', size: 1 } }
      )
      // backend returns total in PaginatedResponse
      return (res.data as unknown as { total?: number })?.total ?? 0
    },
    enabled,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}

// ── Patient alerts ──────────────────────────────────────────────────────────
export function usePatientAlerts(
  patientId: string,
  filters?: AlertFilters
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.alerts(patientId), filters],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedApiResponse<AlertItem>>(
        API_ENDPOINTS.alerts.patient(patientId),
        { params: filters }
      )
      return res.data
    },
    enabled: !!patientId,
    staleTime: 60_000,
  })
}

// ── Acknowledge ─────────────────────────────────────────────────────────────
export function useAcknowledgeAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ alertId }: { alertId: string }) => {
      await apiClient.put(API_ENDPOINTS.alerts.acknowledge(alertId))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.allAlerts })
      qc.invalidateQueries({ queryKey: ['alerts'] })
      toast.success('هشدار دیده‌شده علامت‌گذاری شد')
    },
    onError: () => toast.error('خطا در به‌روزرسانی هشدار'),
  })
}

// ── Resolve ─────────────────────────────────────────────────────────────────
export function useResolveAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ alertId }: { alertId: string }) => {
      await apiClient.put(API_ENDPOINTS.alerts.resolve(alertId))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.allAlerts })
      qc.invalidateQueries({ queryKey: ['alerts'] })
      toast.success('هشدار بسته شد')
    },
    onError: () => toast.error('خطا در بستن هشدار'),
  })
}