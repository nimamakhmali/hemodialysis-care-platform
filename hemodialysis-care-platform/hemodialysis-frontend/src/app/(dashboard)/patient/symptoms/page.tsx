// src/app/(dashboard)/patient/symptoms/page.tsx
"use client";

import { useAuthStore } from "@/features/auth/stores/auth.store";
import { SymptomsPageView } from "@/features/symptoms/components/SymptomsPageView";
import { PageLoader } from "@/components/feedback/PageLoader";

export default function SymptomsPage() {
  const user = useAuthStore((s) => s.user);
  if (!user?.id) return <PageLoader />;
  return <SymptomsPageView patientId={user.id} />;
}