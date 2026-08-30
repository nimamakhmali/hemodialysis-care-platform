// src/app/(dashboard)/patient/diet/page.tsx
"use client";

import { useAuthStore } from "@/features/auth/stores/auth.store";
import { DietPageView } from "@/features/fluid-diet/components/DietPageView";
import { PageLoader } from "@/components/feedback/PageLoader";

export default function DietPage() {
  const user = useAuthStore((s) => s.user);
  if (!user?.id) return <PageLoader />;
  return <DietPageView patientId={user.id} />;
}