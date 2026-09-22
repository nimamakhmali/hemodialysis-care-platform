'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { AppShell } from '@/components/layout/AppShell'
import { CLINICIAN_NAV, PATIENT_NAV, ADMIN_NAV } from '@/config/navigation'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { QUERY_KEYS } from '@/lib/query/queryClient'
import type { ApiResponse } from '@/types/api.types'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthStore()

  // Fetch alert count for clinician
  const { data: alertData } = useQuery({
    queryKey: [QUERY_KEYS.allAlerts, 'count'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<{ count: number }>>(
        `${API_ENDPOINTS.alerts.all}?status=new&size=1`
      )
      return (res.data as unknown as { total?: number })?.total ?? 0
    },
    enabled: user?.role === 'clinician' || user?.role === 'admin',
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) return <PageLoader />
  if (!isAuthenticated || !user) return null

  const navItems =
    user.role === 'clinician'
      ? CLINICIAN_NAV
      : user.role === 'admin'
      ? ADMIN_NAV
      : PATIENT_NAV

  return (
    <AppShell navItems={navItems} alertCount={alertData ?? undefined}>
      {children}
    </AppShell>
  )
}