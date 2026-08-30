// src/app/(dashboard)/patient/page.tsx
"use client";

import { useAuthStore } from "@/features/auth/stores/auth.store";
import { PatientDashboard } from "@/features/dashboard/components/patient/PatientDashboard";
import { PageLoader } from "@/components/feedback/PageLoader";

export default function PatientPage() {
  const user = useAuthStore((s) => s.user);

  if (!user?.id) return <PageLoader />;

  return <PatientDashboard patientId={user.id} />;
}