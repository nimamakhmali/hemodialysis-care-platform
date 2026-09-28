'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { AppShell } from '@/components/layout/AppShell'
import { CLINICIAN_NAV, PATIENT_NAV, ADMIN_NAV } from '@/config/navigation'
import { PageLoader } from '@/components/feedback/PageLoader'
import { getDefaultRoute } from '@/config/permissions'
import { useUnreadCount } from '@/features/messages/hooks/useMessages'
import { useAllAlertsCount } from '@/features/alerts/hooks/useAlerts'

function NavBadgeWrapper({
  children,
  role,
}: {
  children: (counts: { alerts: number; messages: number }) => React.ReactNode
  role: string
}) {
  const user = useAuthStore((s) => s.user)
  const patientId = user?.patient_profile?.patient_id ?? ''

  const { data: unreadCount = 0 } = useUnreadCount(
    role === 'patient' ? patientId : ''
  )
  const { data: alertCount = 0 } = useAllAlertsCount(
    role !== 'patient'
  )

  return <>{children({ alerts: alertCount, messages: unreadCount })}</>
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated, isInitializing } = useAuthStore()

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isInitializing, isAuthenticated, router])

  // Show loader while checking session
  if (isInitializing) return <PageLoader />

  // Don't render protected content if not authenticated
  if (!isAuthenticated || !user) return null

  const role = user.role
  const baseNav =
    role === 'clinician'
      ? CLINICIAN_NAV
      : role === 'admin'
      ? ADMIN_NAV
      : PATIENT_NAV

  return (
    <NavBadgeWrapper role={role}>
      {({ alerts, messages }) => {
        // Inject badges into nav
        const navItems = baseNav.map((item) => {
          if (item.href.endsWith('/alerts') && alerts > 0) {
            return { ...item, badge: alerts, badgeVariant: 'danger' as const }
          }
          if (item.href.endsWith('/messages') && messages > 0) {
            return { ...item, badge: messages, badgeVariant: 'danger' as const }
          }
          if (item.href.endsWith('/recommendations') && alerts > 0) {
            return { ...item, badge: alerts, badgeVariant: 'warning' as const }
          }
          return item
        })

        return (
          <AppShell
            navItems={navItems}
            alertCount={role !== 'patient' ? alerts : undefined}
          >
            {children}
          </AppShell>
        )
      }}
    </NavBadgeWrapper>
  )
}