// src/app/(dashboard)/patient/fluid/page.tsx
"use client";

import { useAuthStore } from "@/features/auth/stores/auth.store";
import { FluidPageView } from "@/features/fluid-diet/components/FluidPageView";
import { PageLoader } from "@/components/feedback/PageLoader";

export default function FluidPage() {
  const user = useAuthStore((s) => s.user);
  if (!user?.id) return <PageLoader />;
  return <FluidPageView patientId={user.id} />;
}