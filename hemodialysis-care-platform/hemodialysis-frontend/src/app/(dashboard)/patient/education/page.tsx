// src/app/(dashboard)/patient/education/page.tsx
"use client";

import { useAuthStore } from "@/features/auth/stores/auth.store";
import { PageHeader } from "@/components/layout/PageHeader";
import { EducationListView } from "@/features/education/components/EducationListView";
import { RelevantEducationBanner } from "@/features/education/components/RelevantEducationBanner";
import { BookOpen } from "lucide-react";

export default function PatientEducationPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <PageHeader
        title="آموزش‌ها"
        description="محتوای آموزشی برای بهتر کردن کیفیت درمان"
        icon={<BookOpen className="w-5 h-5" />}
      />
      {user?.id && <RelevantEducationBanner patientId={user.id} />}
      <EducationListView />
    </div>
  );
}