// src/app/(dashboard)/clinician/alerts/page.tsx
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertFeed } from "@/features/alerts/components/AlertFeed";

export default function ClinicianAlertsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="هشدارهای بالینی"
        description="هشدارهای تولیدشده توسط موتور تحلیل سیستم"
      />
      <AlertFeed />
    </div>
  );
}