'use client'

import { useQuery } from '@tanstack/react-query'
import { clinicianDashboardService } from '../services/clinician-dashboard.service'
import { QUERY_KEYS } from '@/lib/query/queryClient'

export function useClinicianDashboard() {
  return useQuery({
    queryKey: [QUERY_KEYS.clinicianDashboard],
    queryFn: clinicianDashboardService.getDashboard,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 3 * 60 * 1000,
  })
}