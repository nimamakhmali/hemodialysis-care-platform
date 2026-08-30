// src/app/(dashboard)/clinician/recommendations/page.tsx
import { PageHeader } from "@/components/layout/PageHeader";
import { PendingRecommendationsList } from "@/features/recommendations/components/PendingRecommendationsList";

export default function ClinicianRecommendationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="توصیه‌های در انتظار"
        description="پیشنهادات سیستم که نیاز به بررسی و تأیید پزشک دارند"
      />
      <PendingRecommendationsList />
    </div>
  );
}