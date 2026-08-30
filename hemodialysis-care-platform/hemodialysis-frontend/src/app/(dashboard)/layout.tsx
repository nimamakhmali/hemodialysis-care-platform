'use client'

import { useAuthStore } from '@features/auth/stores/auth.store'
import { AppShell } from '@components/layout/AppShell'
import {
  CLINICIAN_NAV,
  PATIENT_NAV,
  ADMIN_NAV,
} from '@config/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useAuthStore((s) => s.user)

  const navItems =
    user?.role === 'clinician'
      ? CLINICIAN_NAV
      : user?.role === 'admin'
        ? ADMIN_NAV
        : PATIENT_NAV

  return <AppShell navItems={navItems}>{children}</AppShell>
}