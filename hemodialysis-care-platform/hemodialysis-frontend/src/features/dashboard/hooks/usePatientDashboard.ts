'use client'

import { useQuery } from '@tanstack/react-query'
import { patientDashboardService } from '../services/patient-dashboard.service'
import { QUERY_KEYS } from '@/lib/query/queryClient'

export function usePatientDashboard(patientId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.patientDashboard(patientId),
    queryFn: () => patientDashboardService.getDashboard(patientId),
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}

export function usePatientTrends(patientId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.patientTrends(patientId),
    queryFn: () => patientDashboardService.getTrends(patientId),
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000,
  })
}