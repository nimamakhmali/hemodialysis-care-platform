// src/app/(dashboard)/patient/messages/page.tsx
"use client";

import { useAuthStore } from "@/features/auth/stores/auth.store";
import { MessagesPageView } from "@/features/messages/components/MessagesPageView";
import { PageLoader } from "@/components/feedback/PageLoader";

export default function MessagesPage() {
  const user = useAuthStore((s) => s.user);
  if (!user?.id) return <PageLoader />;
  return <MessagesPageView patientId={user.id} />;
}